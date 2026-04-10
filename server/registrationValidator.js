// Registration validation utilities
const { EVENT_REQUIREMENTS } = require("./defaults");

/**
 * Validate team composition against event requirements
 * @param {Object} registration - Registration object with participants array
 * @param {string} eventName - Event name to validate against
 * @returns {Object} Validation result with valid flag and errors array
 */
function validateTeamComposition(registration, eventName) {
  const requirements = EVENT_REQUIREMENTS[eventName];
  const errors = [];

  if (!requirements) {
    return { valid: true, errors: [] };
  }

  // Check total members
  const totalParticipants = registration.participants.length;
  if (totalParticipants !== requirements.totalMembers) {
    errors.push(
      `Team must have exactly ${requirements.totalMembers} members. You have ${totalParticipants}.`
    );
  }

  // For team-based events, check department breakdown
  if (requirements.type === "team" && requirements.departmentRequirements) {
    const departmentCounts = {
      HR: 0,
      Marketing: 0,
      Finance: 0
    };

    // Count participants by department
    registration.participants.forEach((p) => {
      if (departmentCounts.hasOwnProperty(p.department)) {
        departmentCounts[p.department]++;
      }
    });

    // Validate each department requirement
    Object.entries(requirements.departmentRequirements).forEach(
      ([dept, requirement]) => {
        const count = departmentCounts[dept];
        if (count < requirement.min) {
          errors.push(
            `${dept}: Must have at least ${requirement.min} member(s). You have ${count}.`
          );
        }
        if (count > requirement.max) {
          errors.push(
            `${dept}: Must have at most ${requirement.max} member(s). You have ${count}.`
          );
        }
      }
    );

    // Store department breakdown for reference
    registration.departmentBreakdown = departmentCounts;
  }

  // For cultural events, check category limit
  if (requirements.type === "cultural") {
    if (totalParticipants > requirements.maxCapacity) {
      errors.push(
        `${requirements.name}: Maximum ${requirements.maxCapacity} member(s) allowed. You have ${totalParticipants}.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    requirements,
    breakdown: registration.departmentBreakdown
  };
}

/**
 * Get event requirement details
 * @param {string} eventName - Event name
 * @returns {Object} Requirement object or null
 */
function getEventRequirements(eventName) {
  return EVENT_REQUIREMENTS[eventName] || null;
}

/**
 * Get all event requirements
 * @returns {Object} All event requirements
 */
function getAllEventRequirements() {
  return EVENT_REQUIREMENTS;
}

/**
 * Get event list
 * @returns {Array} Array of event names
 */
function getEventsList() {
  return Object.keys(EVENT_REQUIREMENTS).map((key) => ({
    key,
    name: EVENT_REQUIREMENTS[key].name,
    type: EVENT_REQUIREMENTS[key].type,
    description: EVENT_REQUIREMENTS[key].description
  }));
}

/**
 * Format validation errors for UI display
 * @param {Object} validationResult - Result from validateTeamComposition
 * @returns {string} Formatted error message
 */
function formatValidationErrors(validationResult) {
  if (validationResult.valid) {
    return null;
  }

  return validationResult.errors.join("\n");
}

module.exports = {
  validateTeamComposition,
  getEventRequirements,
  getAllEventRequirements,
  getEventsList,
  formatValidationErrors
};
