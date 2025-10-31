# Implementation Plan

- [x] 1. Set up TypeScript interfaces and types





  - Create ChatMessage, ChartData, ChartDataPoint, ChatRequest, and ChatResponse interfaces in app/page.tsx
  - Define message role types ('user' | 'assistant')
  - Define chart type options ('line' | 'bar' | 'pie')
  - _Requirements: 6.1, 6.2_

- [x] 2. Implement chat state management





  - Add useState hook for messages array (ChatMessage[])
  - Add useState hook for input value (string)
  - Add useState hook for loading state (boolean)
  - Add useRef hook for message container scrolling
  - _Requirements: 5.2, 5.3_

- [x] 3. Create message display component






  - [x] 3.1 Implement message list rendering

    - Map through messages array and render each message
    - Apply conditional styling based on message role (user vs assistant)
    - Add proper Tailwind classes for alignment and styling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  

  - [x] 3.2 Add scrollable container with auto-scroll

    - Wrap messages in scrollable div with max-height
    - Implement auto-scroll to bottom on new messages using useEffect
    - _Requirements: 1.5_
  

  - [x] 3.3 Add timestamp display for messages





    - Format and display message timestamps
    - Use subtle styling for timestamps
    - _Requirements: 2.4_


- [x] 4. Implement chat input component




  - [x] 4.1 Create input field with controlled state


    - Add textarea or input element bound to inputValue state
    - Handle onChange event to update state
    - Add placeholder text
    - _Requirements: 1.1, 1.2_
  
  - [x] 4.2 Add send button with loading state


    - Create send button with onClick handler
    - Disable button when input is empty or loading
    - Show loading indicator when isLoading is true
    - _Requirements: 1.2, 1.3_
  
  - [x] 4.3 Handle Enter key submission


    - Add onKeyDown handler to input
    - Submit message on Enter key press
    - Prevent default form submission behavior
    - _Requirements: 1.3_
  
  - [x] 4.4 Implement input clearing after send


    - Clear inputValue state after successful message send
    - Reset focus to input field
    - _Requirements: 1.4_

- [x] 5. Create message sending logic






  - [x] 5.1 Implement handleSendMessage function

    - Validate input is not empty
    - Create user message object with unique ID and timestamp
    - Add user message to messages array
    - Clear input field
    - Set loading state to true
    - _Requirements: 1.3, 1.4, 3.1_
  

  - [x] 5.2 Implement API call to Snowflake endpoint

    - Make POST request to /api/snowflake with user message
    - Include proper headers (Content-Type: application/json)
    - Handle request body with ChatRequest structure
    - _Requirements: 3.1, 3.2_
  

  - [x] 5.3 Handle API response

    - Parse ChatResponse from API
    - Create assistant message object with response text
    - Include chartData if present in response
    - Add assistant message to messages array
    - Set loading state to false
    - _Requirements: 3.3, 3.5_
  


  - [x] 5.4 Implement error handling

    - Catch API errors and network failures
    - Create error message as assistant message
    - Display user-friendly error text
    - Set loading state to false
    - _Requirements: 3.4_

- [x] 6. Modify API route to handle chat messages





  - [x] 6.1 Update API route to accept ChatRequest


    - Modify POST handler to parse message from request body
    - Keep existing Snowflake connection logic
    - _Requirements: 3.1, 3.5_
  
  - [x] 6.2 Implement simple query mapping logic

    - Create keyword-to-query mapping (e.g., "marketing" → MARKETING_CAMPAIGN query)
    - Default to existing MARKETING_CAMPAIGN query for MVP
    - _Requirements: 3.1_
  
  - [x] 6.3 Transform Snowflake results to ChatResponse format

    - Create response text based on query results
    - Transform data rows to ChartData format when applicable
    - Return structured ChatResponse with message and chartData
    - _Requirements: 3.3, 3.5, 4.1_
  
  - [x] 6.4 Add error handling for chat context

    - Wrap errors in ChatResponse format
    - Return user-friendly error messages
    - Maintain existing error logging
    - _Requirements: 3.4_

- [x] 7. Implement chart rendering component






  - [x] 7.1 Create chart renderer function

    - Accept chartData prop from message
    - Conditionally render chart only when chartData exists
    - Use Recharts components (LineChart, BarChart, etc.)
    - _Requirements: 4.1, 4.2, 4.5_
  

  - [x] 7.2 Adapt existing Recharts configuration




    - Reuse ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
    - Configure chart based on chartData.type
    - Map chartData.data to Recharts format
    - _Requirements: 4.2, 4.3_
  

  - [x] 7.3 Style chart card component



    - Wrap chart in card div with Tailwind classes
    - Add white background, rounded corners, shadow
    - Ensure responsive sizing
    - _Requirements: 4.4_

- [x] 8. Apply Tailwind styling to chat interface






  - [x] 8.1 Style main chat container

    - Add gradient background (reuse existing from POC)
    - Center container with max-width
    - Add proper padding and spacing
    - _Requirements: 2.3, 6.5_
  
  - [x] 8.2 Style message bubbles

    - User messages: blue background, white text, right-aligned
    - Assistant messages: gray background, dark text, left-aligned
    - Add rounded corners, padding, shadows
    - Set max-width to 80% of container
    - _Requirements: 2.1, 2.2, 2.3_
  

  - [x] 8.3 Style input area

    - Fixed position at bottom
    - Flex layout for input and button
    - Add borders, rounded corners, proper spacing
    - Style send button with blue background
    - _Requirements: 1.1, 2.3_
  
  - [x] 8.4 Add loading indicator styling

    - Create animated loading dots or spinner
    - Display as assistant message during API call
    - Use gray color scheme
    - _Requirements: 3.2_

- [x] 9. Update page header and layout




  - Update header title to "Snowflake Chat Assistant"
  - Update description to reflect chat functionality
  - Ensure layout.tsx remains unchanged
  - _Requirements: 5.1, 5.4_

- [x] 10. Final integration and testing





  - [x] 10.1 Test complete message flow

    - Send message and verify it appears in chat
    - Verify API call is made correctly
    - Verify response appears as assistant message
    - _Requirements: 1.3, 3.1, 3.3_
  

  - [x] 10.2 Test chart rendering

    - Verify chart appears when chartData is present
    - Verify no chart when only text response
    - Test chart responsiveness
    - _Requirements: 4.1, 4.5_
  

  - [x] 10.3 Test error scenarios

    - Test with network failure
    - Test with invalid Snowflake credentials
    - Verify error messages display correctly
    - _Requirements: 3.4_
  
  - [x] 10.4 Verify zero runtime errors


    - Check browser console for errors
    - Verify all imports resolve correctly
    - Test TypeScript compilation
    - _Requirements: 6.2, 6.3_
  

  - [x] 10.5 Test responsive design

    - Test on mobile viewport
    - Verify scrolling works correctly
    - Verify input area remains accessible
    - _Requirements: 1.5, 2.3_
