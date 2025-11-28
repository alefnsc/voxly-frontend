// Test script for role-based access control
// This script mocks the API calls and auth functionality

// Mock environment variable
process.env.REACT_APP_BACKEND_URL = 'https://ai-mock-interview-api.voxlycoding.com/';

// Mock user data
const mockUsers = {
  // Positive scenario - has ProgramadorSemPatria role
  'user_2hkR8d3ccSAWCsHkn10P4Ry4z1j': {
    status: "success",
    message: "User information retrieved successfully",
    user: {
      id: "user_2hkR8d3ccSAWCsHkn10P4Ry4z1j",
      email: "alexandrefonsecach@gmail.com",
      name: "Alexandre Fonseca",
      username: "alefnsc",
      level: "pleno",
      followers: 0,
      followings: 0,
      github: "alefnsc",
      instagram: "@ale.fseca",
      linkedin: "https://www.linkedin.com/in/alefnsc",
      role: ["{ProgramadorSemPatria,Base}"],
      imageUrl: null,
      lastLogin: null,
      isDisabled: false,
      isPublicEmail: false,
      location: null
    }
  },
  // Negative scenario - doesn't have ProgramadorSemPatria role
  'user_30CSqbuVi6E3F1rRa99wfL50IC9': {
    status: "success",
    message: "User information retrieved successfully",
    user: {
      id: "user_30CSqbuVi6E3F1rRa99wfL50IC9",
      email: "test@example.com",
      name: "Test User",
      username: "testuser",
      level: "junior",
      followers: 0,
      followings: 0,
      github: "testuser",
      instagram: "@testuser",
      linkedin: "https://www.linkedin.com/in/testuser",
      role: ["{Base}"], // Only Base role, no ProgramadorSemPatria
      imageUrl: null,
      lastLogin: null,
      isDisabled: false,
      isPublicEmail: false,
      location: null
    }
  }
};

// Mock API Service
class MockAPIService {
  async getUserInfo(userId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userData = mockUsers[userId];
    if (!userData) {
      throw new Error(`User not found: ${userId}`);
    }
    
    return userData;
  }
}

// Mock Auth Check Hook
class MockAuthCheck {
  constructor() {
    this.isLoading = true;
    this.userCredits = 0;
    this.hasRequiredRole = false;
    this.showRoleRestrictionModal = false;
  }

  async checkUserRole(userId) {
    try {
      const apiService = new MockAPIService();
      const userInfoResponse = await apiService.getUserInfo(userId);
      const userRoles = userInfoResponse.user.role;
      
      // Check if user has ProgramadorSemPatria role
      const hasPSPRole = userRoles.some(role => 
        role.includes('ProgramadorSemPatria')
      );
      
      this.hasRequiredRole = hasPSPRole;
      return hasPSPRole;
    } catch (error) {
      console.error('Error checking user role:', error);
      this.hasRequiredRole = false;
      return false;
    }
  }

  async loadUserCredits(userId) {
    console.log(`\n🔍 Checking role for user: ${userId}`);
    
    // First check if user has required role
    const hasRole = await this.checkUserRole(userId);
    
    if (!hasRole) {
      console.log('❌ User does not have ProgramadorSemPatria role');
      console.log('🚫 Credits will NOT be assigned');
      console.log('🔒 Access to interview form will be restricted');
      this.isLoading = false;
      return;
    }

    console.log('✅ User has ProgramadorSemPatria role');
    console.log('💰 Assigning 2 credits to user');
    
    // Simulate credit assignment
    this.userCredits = 2;
    this.isLoading = false;
  }

  async updateCredits(action) {
    if (!this.hasRequiredRole) {
      throw new Error('User does not have required role to use credits');
    }

    const newCredits = action === 'use' 
      ? Math.max(0, this.userCredits - 1)
      : this.userCredits + 1;

    this.userCredits = newCredits;
    return newCredits;
  }
}

// Test function
async function testRoleAccess() {
  console.log('🧪 Testing Role-Based Access Control\n');
  
  const testCases = [
    {
      userId: 'user_2hkR8d3ccSAWCsHkn10P4Ry4z1j',
      scenario: 'POSITIVE - Has ProgramadorSemPatria role'
    },
    {
      userId: 'user_30CSqbuVi6E3F1rRa99wfL50IC9',
      scenario: 'NEGATIVE - Does not have ProgramadorSemPatria role'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Test Case: ${testCase.scenario}`);
    console.log(`👤 User ID: ${testCase.userId}`);
    console.log(`${'='.repeat(60)}`);

    const authCheck = new MockAuthCheck();
    
    try {
      await authCheck.loadUserCredits(testCase.userId);
      
      if (authCheck.hasRequiredRole) {
        console.log('\n🎯 Testing credit usage:');
        console.log(`Current credits: ${authCheck.userCredits}`);
        
        // Test using a credit
        const newCredits = await authCheck.updateCredits('use');
        console.log(`After using credit: ${newCredits}`);
        
        // Test restoring a credit
        const restoredCredits = await authCheck.updateCredits('restore');
        console.log(`After restoring credit: ${restoredCredits}`);
        
        console.log('✅ User can access interview form and use credits');
      } else {
        console.log('\n🚫 Testing credit usage (should fail):');
        try {
          await authCheck.updateCredits('use');
        } catch (error) {
          console.log(`❌ Expected error: ${error.message}`);
        }
        console.log('✅ User access is properly restricted');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('🏁 All tests completed!');
  console.log(`${'='.repeat(60)}`);
}

// Run the tests
testRoleAccess().catch(console.error); 