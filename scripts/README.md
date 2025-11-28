# Role-Based Access Control Test Scripts

This directory contains JavaScript test scripts to mock and test the role-based access control functionality for the voxly AI interview application.

## Scripts Overview

### 1. `test-role-access.js`

**Comprehensive test script** that mocks the entire auth flow including:

- API service calls
- Role checking logic
- Credit assignment
- Access control decisions

### 2. `test-api-calls.js`

**Simple API test script** that focuses on testing the API endpoints:

- Mock fetch responses
- User role verification
- Basic access control logic

## Test Scenarios

### Positive Scenario (Has ProgramadorSemPatria Role)

- **User ID**: `user_2hkR8d3ccSAWCsHkn10P4Ry4z1j`
- **Expected Behavior**:
  - ✅ Can access interview form
  - ✅ Credits are assigned (2 credits)
  - ✅ Can use and restore credits
  - ✅ No role restriction modal shown

### Negative Scenario (No ProgramadorSemPatria Role)

- **User ID**: `user_30CSqbuVi6E3F1rRa99wfL50IC9`
- **Expected Behavior**:
  - ❌ Cannot access interview form
  - ❌ Credits are NOT assigned
  - ❌ Credit usage throws error
  - 🔒 Role restriction modal shown

## How to Run

### Prerequisites

Make sure you have Node.js installed on your system.

### Running the Comprehensive Test

```bash
node scripts/test-role-access.js
```

### Running the Simple API Test

```bash
node scripts/test-api-calls.js
```

## Expected Output

### For Positive Scenario (user_2hkR8d3ccSAWCsHkn10P4Ry4z1j):

```
✅ User has ProgramadorSemPatria role
💰 Assigning 2 credits to user
🎯 Testing credit usage:
Current credits: 2
After using credit: 1
After restoring credit: 2
✅ User can access interview form and use credits
```

### For Negative Scenario (user_30CSqbuVi6E3F1rRa99wfL50IC9):

```
❌ User does not have ProgramadorSemPatria role
🚫 Credits will NOT be assigned
🔒 Access to interview form will be restricted
🚫 Testing credit usage (should fail):
❌ Expected error: User does not have required role to use credits
✅ User access is properly restricted
```

## Mock Data Structure

The scripts use the following mock user data structure:

```javascript
{
  status: "success",
  message: "User information retrieved successfully",
  user: {
    id: "user_id",
    email: "user@example.com",
    name: "User Name",
    username: "username",
    level: "pleno",
    role: ["{ProgramadorSemPatria,Base}"], // Key field for role checking
    // ... other fields
  }
}
```

## Key Features Tested

1. **Role Detection**: Checks if user has "ProgramadorSemPatria" in their role array
2. **Credit Assignment**: Only assigns credits to users with required role
3. **Access Control**: Restricts interview form access based on role
4. **Error Handling**: Proper error messages for unauthorized users
5. **API Integration**: Simulates real API calls with delays

## Customization

To test with different user IDs or role configurations:

1. Modify the `mockUsers` object in `test-role-access.js`
2. Update the `mockResponses` object in `test-api-calls.js`
3. Add new test cases to the `testCases` array

## Integration with Real Backend

When connecting to your real backend:

1. Replace the mock fetch function with real API calls
2. Update the `REACT_APP_BACKEND_URL` environment variable
3. Ensure your backend endpoint `/get-user-info/{user_id}` returns the expected format

## Troubleshooting

- **Script not running**: Make sure you're in the project root directory
- **Module not found**: Ensure Node.js is installed and you're using the correct path
- **Unexpected results**: Check that the mock data matches your expected API response format
