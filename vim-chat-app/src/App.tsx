import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPaperPlane, faBars, faTimes, faComments, faCog, faFileUpload } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const socket = io('http://192.168.1.16:5000');

const App: React.FC = () => {
  const [name, setName] = useState('');
  const [registered, setRegistered] = useState(false);
  const [users, setUsers] = useState<{ id: string, name: string, online: boolean }[]>([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ user: string, text: string, time: string, file?: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

      // Show browser notification for new messages
      if (document.hidden) {
        new Notification(`${message.user}: ${message.text}`);
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
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      const time = new Date().toLocaleTimeString();
      socket.emit('message', { user: name, text: message, time });
      setMessage('');
    }
  };

  const sendFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const time = new Date().toLocaleTimeString();
      socket.emit('message', { user: name, text: `${file.name}`, time, file: reader.result });
    };
    reader.readAsDataURL(file);
  };

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
            <li key={user.id} className="p-2 rounded-xl bg-gray-700 mb-2 flex items-center justify-between">
              <div className="flex items-center">
                {getAvatar(user.name)}
                <span className="ml-2">{user.name}</span>
              </div>
              <span className={`w-3 h-3 rounded-full ${user.online ? 'bg-green-500' : 'bg-red-500'}`} />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-green-600 p-4 text-white flex justify-between items-center sticky top-0 z-10 w-full md:rounded-none">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faComments} className="mr-2" />
            ChatApp by Fardin
          </div>
          <button onClick={() => setSettingsOpen(!settingsOpen)}>
            <FontAwesomeIcon icon={faCog} />
          </button>
        </header>

        {settingsOpen && (
          <div className="p-4 bg-gray-800 text-white">
            <h2 className="text-xl mb-4">Settings</h2>
            <div className="mb-4">
              <label className="block mb-2">Display Name</label>
              <input
                className="border p-2 bg-gray-700 text-white rounded w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-2 p-3 rounded-xl ${getMessageColor(msg.user)} text-white flex items-start`}>
                <div className="flex items-start">
                  {getAvatar(msg.user)}
                  <div className="ml-2">
                    <strong>{msg.user}</strong> <span className="text-sm text-gray-400">{msg.time}</span>
                    {msg.file ? (
                      <div>
                        <a href={msg.file} download className="text-blue-300">{msg.text}</a>
                      </div>
                    ) : (
                      <div>{msg.text}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="p-4 bg-gray-900 flex items-center sticky bottom-0 w-full md:rounded-none">
          <input
            className="flex-1 border p-2 mr-2 rounded-xl bg-gray-700 text-white w-1/3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <label className="bg-green-500 text-white p-2 rounded-xl flex items-center cursor-pointer">
            <FontAwesomeIcon icon={faFileUpload} className="mr-2" />
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  sendFile(e.target.files[0]);
                }
              }}
            />
            File
          </label>
          <button
            className="bg-green-500 text-white p-2 rounded-xl flex items-center ml-2"
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
