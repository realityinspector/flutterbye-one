/**
 * Lead routes with team sharing support
 * Implements routes for creating and managing leads with organization sharing
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { globalLeads, userLeads, organizations, organizationMembers } = require('../../shared/db/schema');
const { and, eq, desc, inArray, or, isNull } = require('drizzle-orm');
const { authenticateJWT } = require('../auth');

/**
 * Helper to check if user is a member of an organization
 */
async function isUserInOrganization(userId, organizationId) {
  if (!organizationId) return false;
  
  const [membership] = await db.select()
    .from(organizationMembers)
    .where(and(
      eq(organizationMembers.organizationId, organizationId),
      eq(organizationMembers.userId, userId)
    ))
    .limit(1);
    
  return !!membership;
}

/**
 * Get all leads for the authenticated user
 * Includes both personal leads and shared leads from organizations
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Defensive check - make sure user ID is valid
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    // Use a simpler approach to get leads
    const rawLeads = await db.select()
      .from(userLeads)
      .where(eq(userLeads.userId, userId))
      .orderBy(desc(userLeads.priority));
      
    // Get the global lead details and organization info for each lead
    const leads = [];
    for (const lead of rawLeads) {
      const [globalLeadInfo] = await db.select()
        .from(globalLeads)
        .where(eq(globalLeads.id, lead.globalLeadId));
        
      // Add organization information if the lead is shared
      let organizationInfo = null;
      if (lead.organizationId && lead.isShared) {
        [organizationInfo] = await db.select()
          .from(organizations)
          .where(eq(organizations.id, lead.organizationId));
      }
        
      if (globalLeadInfo) {
        leads.push({
          ...lead,
          globalLead: globalLeadInfo,
          organization: organizationInfo
        });
      }
    }
    
    res.json({ success: true, data: leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
});

/**
 * Get a specific lead by ID
 * Includes access control for shared leads
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Get the lead first to check permissions
    const [lead] = await db.select()
      .from(userLeads)
      .where(eq(userLeads.id, leadId));
      
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    // Check access permissions
    if (lead.userId === userId) {
      // User is the owner, allow access
      const leadWithDetails = await db.query.userLeads.findFirst({
        where: eq(userLeads.id, leadId),
        with: {
          globalLead: true,
          organization: lead.organizationId ? true : undefined
        },
      });
      
      return res.json({ success: true, data: leadWithDetails });
    } else if (lead.organizationId && lead.isShared) {
      // Check if user is a member of the organization
      const isMember = await isUserInOrganization(userId, lead.organizationId);
      if (isMember) {
        const leadWithDetails = await db.query.userLeads.findFirst({
          where: eq(userLeads.id, leadId),
          with: {
            globalLead: true,
            organization: true
          },
        });
        
        return res.json({ success: true, data: leadWithDetails });
      }
    }
    
    // User does not have access to this lead
    return res.status(403).json({ 
      success: false, 
      message: 'You do not have permission to access this lead' 
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lead' });
  }
});

/**
 * Create a new lead
 * Supports creating both personal and team leads
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { 
      companyName, contactName, phoneNumber, email, address, 
      city, state, zipCode, industry, website, notes,
      organizationId, isShared 
    } = req.body;
    
    const userId = req.user.id;
    
    // Check organization membership if creating a team lead
    if (organizationId) {
      const isMember = await isUserInOrganization(userId, organizationId);
      if (!isMember) {
        return res.status(403).json({ 
          success: false, 
          message: 'You are not a member of this organization' 
        });
      }
    }
    
    // Create a global lead record
    const [globalLead] = await db.insert(globalLeads).values({
      companyName,
      contactName,
      phoneNumber,
      email,
      address,
      city,
      state,
      zipCode,
      industry,
      website,
    }).returning();
    
    // Create a user-specific lead record
    const [userLead] = await db.insert(userLeads).values({
      userId,
      globalLeadId: globalLead.id,
      status: 'new',
      priority: 5, // Default medium priority
      notes,
      organizationId: organizationId ? parseInt(organizationId) : null,
      isShared: organizationId ? !!isShared : false,
    }).returning();
    
    // Get organization details if this is a team lead
    let organizationDetails = null;
    if (organizationId) {
      [organizationDetails] = await db.select()
        .from(organizations)
        .where(eq(organizations.id, organizationId));
    }
    
    // Return the combined lead data
    const createdLead = {
      ...userLead,
      globalLead,
      organization: organizationDetails,
    };
    
    res.status(201).json({ success: true, data: createdLead });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ success: false, message: 'Failed to create lead' });
  }
});

/**
 * Update a lead
 * Includes access control for team leads
 */
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Get the lead first to check permissions
    const [lead] = await db.select()
      .from(userLeads)
      .where(eq(userLeads.id, leadId));
      
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    // Check if user has permission to update this lead
    let hasPermission = lead.userId === userId;
    
    // If it's a team lead, also check organization membership
    if (!hasPermission && lead.organizationId && lead.isShared) {
      const isMember = await isUserInOrganization(userId, lead.organizationId);
      hasPermission = isMember;
    }
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this lead' 
      });
    }
    
    // Handle team/personal status changes
    let organizationId = lead.organizationId;
    let isSharedFlag = lead.isShared;
    
    if (req.body.organizationId !== undefined) {
      // Converting to a team lead or changing organization
      if (req.body.organizationId) {
        const newOrgId = parseInt(req.body.organizationId);
        
        // Check if user is a member of the new organization
        const isMember = await isUserInOrganization(userId, newOrgId);
        if (!isMember) {
          return res.status(403).json({ 
            success: false, 
            message: 'You are not a member of this organization' 
          });
        }
        
        organizationId = newOrgId;
        isSharedFlag = req.body.isShared !== undefined ? !!req.body.isShared : lead.isShared;
      } else {
        // Converting to a personal lead
        organizationId = null;
        isSharedFlag = false;
      }
    }
    
    // Update global lead data if provided
    if (req.body.companyName || req.body.contactName || req.body.phoneNumber ||
        req.body.email || req.body.address || req.body.city ||
        req.body.state || req.body.zipCode || req.body.industry ||
        req.body.website) {
      await db.update(globalLeads)
        .set({
          companyName: req.body.companyName,
          contactName: req.body.contactName,
          phoneNumber: req.body.phoneNumber,
          email: req.body.email,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zipCode: req.body.zipCode,
          industry: req.body.industry,
          website: req.body.website,
        })
        .where(eq(globalLeads.id, lead.globalLeadId));
    }
    
    // Update user lead data
    const [updatedUserLead] = await db.update(userLeads)
      .set({
        status: req.body.status || lead.status,
        priority: req.body.priority !== undefined ? req.body.priority : lead.priority,
        notes: req.body.notes !== undefined ? req.body.notes : lead.notes,
        reminderDate: req.body.reminderDate || lead.reminderDate,
        organizationId,
        isShared: isSharedFlag,
      })
      .where(eq(userLeads.id, leadId))
      .returning();
    
    // Fetch the updated lead with global data
    const completeLead = await db.query.userLeads.findFirst({
      where: eq(userLeads.id, updatedUserLead.id),
      with: {
        globalLead: true,
        organization: organizationId ? true : undefined
      },
    });
    
    res.json({ success: true, data: completeLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, message: 'Failed to update lead' });
  }
});

/**
 * Delete a lead
 * Includes access control for team leads
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Get the lead first to check permissions
    const [lead] = await db.select()
      .from(userLeads)
      .where(eq(userLeads.id, leadId));
      
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    // Check if user has permission to delete this lead
    let hasPermission = lead.userId === userId;
    
    // If it's a team lead, also check admin permissions in organization
    if (!hasPermission && lead.organizationId && lead.isShared) {
      const [membership] = await db.select()
        .from(organizationMembers)
        .where(and(
          eq(organizationMembers.organizationId, lead.organizationId),
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.role, 'admin')
        ))
        .limit(1);
        
      // Only organization admins can delete team leads
      hasPermission = !!membership;
    }
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to delete this lead' 
      });
    }
    
    // Delete the user lead
    const result = await db.delete(userLeads)
      .where(eq(userLeads.id, leadId))
      .returning({ id: userLeads.id });
    
    res.json({ 
      success: true, 
      data: { id: result[0].id, message: 'Lead deleted successfully' } 
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lead' });
  }
});

module.exports = router;