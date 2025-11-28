// Simple API test script for role-based access
// Tests the getUserInfo endpoint for both positive and negative scenarios

// Mock fetch function
global.fetch = async (url) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const userId = url.split('/').pop();
  
  const mockResponses = {
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
  
  const response = mockResponses[userId];
  
  if (!response) {
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'User not found' })
    };
  }
  
  return {
    ok: true,
    status: 200,
    json: async () => response
  };
};

// Mock API Service (simplified version of your actual service)
class APIService {
  async getUserInfo(userId) {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-user-info/${userId}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  }
}

// Test function
async function testAPICalls() {
  console.log('🌐 Testing API Calls for Role-Based Access\n');
  
  const apiService = new APIService();
  const testUsers = [
    {
      id: 'user_2hkR8d3ccSAWCsHkn10P4Ry4z1j',
      name: 'Alexandre Fonseca (PSP Member)',
      expectedRole: 'ProgramadorSemPatria'
    },
    {
      id: 'user_30CSqbuVi6E3F1rRa99wfL50IC9',
      name: 'Test User (Non-PSP)',
      expectedRole: 'Base only'
    }
  ];

  for (const testUser of testUsers) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`👤 Testing: ${testUser.name}`);
    console.log(`🆔 User ID: ${testUser.id}`);
    console.log(`🎯 Expected: ${testUser.expectedRole}`);
    console.log(`${'='.repeat(50)}`);

    try {
      console.log('📡 Making API call...');
      const userInfo = await apiService.getUserInfo(testUser.id);
      
      console.log('✅ API call successful!');
      console.log(`📧 Email: ${userInfo.user.email}`);
      console.log(`👤 Name: ${userInfo.user.name}`);
      console.log(`🏷️  Roles: ${userInfo.user.role.join(', ')}`);
      
      // Check if user has ProgramadorSemPatria role
      const hasPSPRole = userInfo.user.role.some(role => 
        role.includes('ProgramadorSemPatria')
      );
      
      if (hasPSPRole) {
        console.log('🎉 User HAS ProgramadorSemPatria role');
        console.log('✅ Can access interview form');
        console.log('💰 Credits will be assigned');
      } else {
        console.log('🚫 User does NOT have ProgramadorSemPatria role');
        console.log('🔒 Access to interview form will be restricted');
        console.log('❌ Credits will NOT be assigned');
      }
      
    } catch (error) {
      console.error('❌ API call failed:', error.message);
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('🏁 API testing completed!');
  console.log(`${'='.repeat(50)}`);
}

// Set environment variable and run tests
process.env.REACT_APP_BACKEND_URL = 'https://your-backend-url.com';
testAPICalls().catch(console.error); 