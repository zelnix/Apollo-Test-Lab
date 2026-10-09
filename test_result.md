#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build "Apollo Threat Lab" - a standalone internal security testing utility (Expo/React Native)
  that generates safe, controlled network activity to test an external VPN application. Has 10
  predefined threat scenarios: Phishing Link, Malicious Domain, Suspicious Connection, Redirect,
  Safe Traffic, Stop Test, Malware URL, EICAR Download, Unencrypted HTTP, Bad Certificate.
  Dark navy cybersecurity theme. Local-first app. The user's most recent request is: when a test
  button is clicked, show a bottom sheet modal with "Running test..." spinner, then update to
  "Test Completed" with the outcome text, and show a "Close" button to dismiss.

backend:
  - task: "FastAPI health stub"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Minimal FastAPI health endpoint serving /health and /api/health. Runs correctly."

frontend:
  - task: "10 scenario cards render on home screen"
    implemented: true
    working: true
    file: "frontend/app/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "All 10 scenarios defined in scenarios.ts and rendered via ScenarioCard components."

  - task: "Test Result Modal / Bottom Sheet"
    implemented: true
    working: "NA"
    file: "frontend/app/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          Previous agent rewrote index.tsx to implement a bottom-sheet modal. State management:
          - showResultSheet: bool controls Modal visibility
          - Opens automatically when runner.isRunning becomes true (useEffect)
          - Shows ActivityIndicator + 'Test in progress...' while running
          - Shows Outcome text + 'Close' button when runner.isRunning is false
          - Close button calls handleCloseResult() which sets showResultSheet=false
          - Android back button only closes if not running
          - Backdrop tap closes if not running
          Needs frontend testing to confirm it works in the browser preview.

  - task: "History screen"
    implemented: true
    working: true
    file: "frontend/app/history.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "History screen renders saved test entries from local storage."

  - task: "Settings screen"
    implemented: true
    working: true
    file: "frontend/app/settings.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Settings screen allows configuring custom endpoints."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Test Result Modal / Bottom Sheet"
    - "10 scenario cards render on home screen"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Testing focus: The previous agent implemented a bottom-sheet modal in index.tsx but never
      tested it. Please verify:
      1. The home screen loads with all 10 scenario cards visible.
      2. Clicking any non-stop scenario card (e.g. "Safe Traffic") opens the modal overlay.
      3. The modal shows an ActivityIndicator spinner with "Test in progress..." text while the
         test runs.
      4. After the test completes, the modal updates to show the "Observed Outcome" text and a
         "Close" button.
      5. Clicking "Close" dismisses the modal.
      6. The modal has a dark navy theme matching the rest of the app.
      NOTE: The "Phishing Link", "Malware URL" and some other browser-kind scenarios open an
      external browser (Linking.openURL) and will show a modal that closes quickly. DNS tests
      are native-only and may show a timeout/failure in the web preview — that is expected.
      Focus on the MODAL UI behaviour, not the actual network outcome.
      No credentials required. No backend auth.
