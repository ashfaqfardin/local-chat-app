import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPaperPlane, faBars, faTimes, faComments } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const socket = io('http://192.168.1.16:5000');

const App: React.FC = () => {
  const [name, setName] = useState('');
  const [registered, setRegistered] = useState(false);
  const [users, setUsers] = useState<{ id: string, name: string }[]>([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ user: string, text: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socket.on('userList', (users) => {
      setUsers(users);
    });

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      
      // Play vibration when a new message arrives
      if (navigator.vibrate) {
        navigator.vibrate(200); // Vibrate for 200ms
      }
    });

    return () => {
      socket.off('userList');
      socket.off('message');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const registerUser = () => {
    if (name.trim()) {
      socket.emit('register', name);
      setRegistered(true);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('message', { user: name, text: message });
      setMessage('');
    }
  };

  if (!registered) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="p-6 bg-gray-800 rounded-xl shadow-md">
          <h1 className="text-2xl mb-4 text-white">Enter your name</h1>
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faUser} className="mr-2 text-white" />
            <input
              className="border p-2 flex-1 bg-gray-700 text-white rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button
            className="bg-green-500 text-white p-2 flex items-center rounded"
            onClick={registerUser}
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  const getMessageColor = (userName: string) => {
    if (userName === name) {
      return 'bg-blue-600';
    } else {
      const userIndex = users.findIndex(user => user.name === userName);
      const colors = ['bg-gray-700', 'bg-yellow-600', 'bg-red-600', 'bg-purple-600'];
      return colors[userIndex % colors.length];
    }
  };

  const getAvatar = (userName: string) => {
    return (
      <div className="w-8 h-8 flex items-center justify-center bg-gray-600 text-white rounded-full text-sm font-bold">
        {userName.charAt(0)}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 h-screen flex flex-col md:flex-row">
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block bg-gray-800 text-white w-full md:w-1/4 lg:w-1/5 h-full p-4 space-y-4`}>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl">Active Users</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <ul>
          {users.map((user) => (
            <li key={user.id} className="p-2 rounded-xl bg-gray-700 mb-2 flex items-center">
              {getAvatar(user.name)}
              <span className="ml-2">{user.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-green-600 p-4 text-white flex justify-between items-center md:rounded-none">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faComments} className="mr-2" />
            ChatApp by Fardin
          </div>
        </header>

        <div className="flex-1 p-4 overflow-y-auto bg-gray-900 mt-4 md:mt-0 rounded-t-xl">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-2 p-3 rounded-xl ${getMessageColor(msg.user)} text-white flex items-start`}>
                {getAvatar(msg.user)}
                <div className="ml-2">
                  <strong>{msg.user}:</strong> {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="p-4 bg-gray-900 flex items-center md:rounded-none sticky bottom-0">
          <input
            className="flex-1 border p-2 mr-4 rounded-xl bg-gray-700 text-white"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            className="bg-green-500 text-white p-2 rounded-xl flex items-center"
            onClick={sendMessage}
          >
            Send <FontAwesomeIcon icon={faPaperPlane} className="ml-2" />
          </button>
        </footer>
      </div>
    </div>
  );
};

export default App;
