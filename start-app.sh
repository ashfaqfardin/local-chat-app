# Start the backend server in the background
(cd vim-chat-app/backend && npx ts-node server.ts) &
BACKEND_PID=$!
echo "Backend server PID: $BACKEND_PID"

# Start the React app in the background
(cd vim-chat-app && npm start) &
FRONTEND_PID=$!
echo "Frontend server PID: $FRONTEND_PID"

# Wait for processes to exit
wait $BACKEND_PID
wait $FRONTEND_PID

