/**
 * Organization members routes
 * Endpoints for managing organization memberships
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { organizations, organizationMembers, users } = require('../../shared/db/schema');
const { and, eq, ne } = require('drizzle-orm');
const { authenticateJWT } = require('../auth');

/**
 * @route   POST /api/organizations/:orgId/members
 * @desc    Add a user to an organization
 * @access  Private/Admin
 */
router.post('/:orgId/members', authenticateJWT, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.orgId);
    const { username, email, role = 'member' } = req.body;
    const userId = req.user.id;

    // Check if the organization exists
    const [organization] = await db.select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Check if the requester is an admin of the organization
    const [membership] = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.role, 'admin')
      ))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only organization admins can add members' 
      });
    }

    // Find the user to add by either username or email
    let userToAdd;
    if (username) {
      [userToAdd] = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
    } else if (email) {
      [userToAdd] = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email is required to add a member' 
      });
    }

    if (!userToAdd) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. They must be registered in the system to be added to an organization' 
      });
    }

    // Check if user is already a member
    const [existingMembership] = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userToAdd.id)
      ))
      .limit(1);

    if (existingMembership) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already a member of this organization' 
      });
    }

    // Add the user to the organization
    const [newMembership] = await db.insert(organizationMembers)
      .values({
        organizationId,
        userId: userToAdd.id,
        role: role || 'member'
      })
      .returning();

    return res.status(201).json({ 
      success: true, 
      data: {
        ...newMembership,
        username: userToAdd.username,
        fullName: userToAdd.fullName,
        email: userToAdd.email
      },
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error('Error adding organization member:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/organizations/:orgId/members
 * @desc    Get all members of an organization
 * @access  Private/Member
 */
router.get('/:orgId/members', authenticateJWT, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.orgId);
    const userId = req.user.id;

    // Check if user is a member of this organization
    const [userMembership] = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      ))
      .limit(1);

    if (!userMembership) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a member of this organization' 
      });
    }

    // Get all members with user details
    const members = await db.select({
      id: organizationMembers.id,
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

    return res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/organizations/:orgId/members/:memberId
 * @desc    Update a member's role in an organization
 * @access  Private/Admin
 */
router.put('/:orgId/members/:memberId', authenticateJWT, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.orgId);
    const membershipId = parseInt(req.params.memberId);
    const { role } = req.body;
    const userId = req.user.id;

    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid role (admin or member) is required' 
      });
    }

    // Check if the requester is an admin of the organization
    const [requesterMembership] = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.role, 'admin')
      ))
      .limit(1);

    if (!requesterMembership) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only organization admins can update member roles' 
      });
    }

    // Find the membership to update
    const [membershipToUpdate] = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.id, membershipId),
        eq(organizationMembers.organizationId, organizationId)
      ))
      .limit(1);

    if (!membershipToUpdate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found in this organization' 
      });
    }

    // Check if user is trying to demote themselves
    if (membershipToUpdate.userId === userId && role !== 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot demote yourself from admin role' 
      });
    }

    // Update the membership role
    const [updatedMembership] = await db.update(organizationMembers)
      .set({ role })
      .where(eq(organizationMembers.id, membershipId))
      .returning();

    // Get the user details for the updated membership
    const [userDetails] = await db.select({
      username: users.username,
      fullName: users.fullName,
      email: users.email
    })
    .from(users)
    .where(eq(users.id, updatedMembership.userId))
    .limit(1);

    return res.json({ 
      success: true, 
      data: {
        ...updatedMembership,
        ...userDetails
      },
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization member:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/organizations/:orgId/members/:memberId
 * @desc    Remove a member from an organization
 * @access  Private/Admin or Self
 */
router.delete('/:orgId/members/:memberId', authenticateJWT, async (req, res) => {
  try {
    const organizationId = parseInt(req.params.orgId);
    const membershipId = parseInt(req.params.memberId);
    const userId = req.user.id;

    // First, check if the membership exists
    const [membershipToDelete] = await db.select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.id, membershipId),
        eq(organizationMembers.organizationId, organizationId)
      ))
      .limit(1);

    if (!membershipToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'Member not found in this organization' 
      });
    }

    // Check if user is removing themselves (which is always allowed)
    const isSelf = membershipToDelete.userId === userId;

    // If not self, check if user is an admin
    if (!isSelf) {
      const [requesterMembership] = await db.select()
        .from(organizationMembers)
        .where(and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.role, 'admin')
        ))
        .limit(1);

      if (!requesterMembership) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only organization admins can remove other members' 
        });
      }
    }

    // Check if the organization has other admins if removing an admin
    if (membershipToDelete.role === 'admin') {
      // Count other admins in the organization
      const [adminCount] = await db.select({
        count: count()
      })
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.role, 'admin'),
        ne(organizationMembers.id, membershipId)
      ));

      if (!adminCount || adminCount.count === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot remove the last admin from the organization' 
        });
      }
    }

    // Delete the membership
    await db.delete(organizationMembers)
      .where(eq(organizationMembers.id, membershipId));

    return res.json({ 
      success: true, 
      message: 'Member removed from organization successfully' 
    });
  } catch (error) {
    console.error('Error removing organization member:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;