/**
 * Organizations routes for team sharing features
 * Implements routes for creating, managing, and interacting with organizations
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { organizations, organizationMembers, userLeads, users } = require('../../shared/db/schema');
const { and, eq, inArray } = require('drizzle-orm');
const { authenticateJWT } = require('../auth');

/**
 * @route   POST /api/organizations
 * @desc    Create new organization
 * @access  Private
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Validate organization name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization name is required' 
      });
    }
    
    if (name.trim().length > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization name cannot exceed 100 characters' 
      });
    }

    // Create the organization with trimmed values
    const [newOrganization] = await db.insert(organizations)
      .values({
        name: name.trim(),
        description: description ? description.trim() : null,
        createdBy: userId,
      })
      .returning();

    if (!newOrganization) {
      return res.status(500).json({ success: false, message: 'Failed to create organization' });
    }

    // Add the creator as an admin member
    await db.insert(organizationMembers)
      .values({
        organizationId: newOrganization.id,
        userId,
        role: 'admin',
      });

    return res.status(201).json({ 
      success: true, 
      data: newOrganization,
      message: 'Organization created successfully'
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/organizations
 * @desc    Get all organizations for the authenticated user
 * @access  Private
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all organizations created by the user
    const userOrgs = await db.select()
      .from(organizations)
      .where(eq(organizations.createdBy, userId));

    // Add role information to each organization
    const orgsWithRoles = userOrgs.map(org => {
      return {
        ...org,
        userRole: 'admin'  // Creator is always an admin
      };
    });

    return res.json({ success: true, data: orgsWithRoles });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/organizations/:id
 * @desc    Get organization by ID
 * @access  Private
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if user is a member of this organization
    const membership = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      ))
      .limit(1);

    if (!membership.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a member of this organization' 
      });
    }

    // Get organization details
    const [organization] = await db.select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Get organization members with user details
    const members = await db.select({
      membershipId: organizationMembers.id,
      userId: users.id,
      username: users.username,
      fullName: users.fullName,
      email: users.email,
      role: organizationMembers.role,
      joinedAt: organizationMembers.joinedAt
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(eq(organizationMembers.organizationId, organizationId));

    // Get the lead count for this organization
    const [leadCount] = await db.select({ count: count() })
      .from(userLeads)
      .where(and(
        eq(userLeads.organizationId, organizationId),
        eq(userLeads.isShared, true)
      ));

    return res.json({
      success: true,
      data: {
        ...organization,
        members,
        userRole: membership[0].role,
        leadCount: leadCount ? leadCount.count : 0
      }
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization
 * @access  Private/Admin
 */
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const userId = req.user.id;
    const { name, description } = req.body;

    // Validate organization name
    if (name !== undefined && (!name || name.trim().length === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization name cannot be empty' 
      });
    }

    if (name && name.trim().length > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization name cannot exceed 100 characters' 
      });
    }

    // Check if user is an admin of this organization
    const [membership] = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a member of this organization' 
      });
    }

    if (membership.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only organization admins can update the organization' 
      });
    }

    // Check if user is the creator of this organization (for additional authorization)
    const [organization] = await db.select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    const isCreator = organization && organization.createdBy === userId;

    // If user is not the creator and trying to change the name, restrict the action
    if (!isCreator && name !== undefined && name !== organization.name) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the organization creator can change the organization name' 
      });
    }

    // Update the organization
    const [updatedOrganization] = await db.update(organizations)
      .set({
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        updatedAt: new Date()
      })
      .where(eq(organizations.id, organizationId))
      .returning();

    if (!updatedOrganization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    return res.json({ 
      success: true, 
      data: updatedOrganization,
      message: 'Organization updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/organizations/:id
 * @desc    Delete organization
 * @access  Private/Admin
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if user is an admin of this organization or the creator
    const [organization] = await db.select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const [membership] = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      ))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a member of this organization' 
      });
    }

    const isCreator = organization.createdBy === userId;
    const isAdmin = membership.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the organization creator or an admin can delete the organization' 
      });
    }

    // Delete organization (cascade will handle members and lead references)
    await db.delete(organizations)
      .where(eq(organizations.id, organizationId));

    return res.json({ 
      success: true, 
      message: 'Organization deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;