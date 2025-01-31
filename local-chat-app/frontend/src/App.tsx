import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPaperPlane,
  faBars,
  faTimes,
  faComments,
  faCog,
  faFileUpload,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import "./App.css";

const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
if (!process.env.REACT_APP_SOCKET_URL) {
  console.warn(
    "REACT_APP_SOCKET_URL is not defined. Using default URL:",
    socketUrl
  );
}
const socket = io(socketUrl);

const App: React.FC = () => {
  const [name, setName] = useState("");
  const [registered, setRegistered] = useState(false);
  const [users, setUsers] = useState<
    { id: string; name: string; online: boolean }[]
  >([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { user: string; text: string; time: string; file?: string }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socket.on("userList", (users) => {
      setUsers(users);
    });

    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);

      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      if (document.hidden) {
        new Notification(`${message.user}: ${message.text}`);
      }
    });

    return () => {
      socket.off("userList");
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const registerUser = () => {
    if (name.trim()) {
      socket.emit("register", name);
      setRegistered(true);
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      const time = new Date().toLocaleTimeString();
      socket.emit("message", { user: name, text: message, time });
      setMessage("");
    }
  };

  const sendFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const time = new Date().toLocaleTimeString();
      socket.emit("message", {
        user: name,
        text: `${file.name}`,
        time,
        file: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const getMessageColor = (userName: string) => {
    if (userName === name) {
      return "bg-blue-600";
    } else {
      const colors = [
        "bg-gray-700",
        "bg-yellow-600",
        "bg-red-600",
        "bg-purple-600",
        "bg-green-600",
        "bg-teal-600",
      ];
      const hash = Array.from(userName).reduce(
        (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc),
        0
      );
      return colors[Math.abs(hash) % colors.length];
    }
  };

  const getAvatar = (userName: string) => {
    const hash = Array.from(userName).reduce(
      (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc),
      0
    );
    const color = `hsl(${hash % 360}, 70%, 60%)`;

    return (
      <div
        className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold border-2 border-white"
        style={{ backgroundColor: color }}
      >
        {userName.charAt(0)}
      </div>
    );
  };

  if (!registered) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="w-fit p-8 bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-gray-400 text-sm font-medium mb-1">
              LOCAL CHAT
            </h2>
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label className="text-sm text-gray-400 mb-2 block">
                Display Name
              </label>
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faUser}
                  className="absolute left-3 text-gray-400"
                />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 
                             text-white rounded-lg focus:ring-2 focus:ring-green-500 
                             focus:border-transparent transition-all duration-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <button
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 
                         rounded-lg font-medium transition-colors duration-200 
                         flex items-center justify-center space-x-2"
              onClick={registerUser}
            >
              <span>Continue to Chat</span>
              <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 h-screen flex flex-col md:flex-row relative overflow-hidden">
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative z-30 bg-slate-800 text-white w-3/4 md:w-1/4 lg:w-1/5 xl:w-1/6 h-full p-6 
    space-y-4 border-r border-slate-700 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-100">
            Active Users
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden hover:text-slate-300 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all flex items-center justify-between"
            >
              <div className="flex items-center">
                {getAvatar(user.name)}
                <span className="ml-3 font-medium">{user.name}</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg" />
            </li>
          ))}
        </ul>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col">
        <header className="bg-slate-800 px-6 py-4 text-white flex justify-between items-center sticky top-0 z-10 w-full shadow-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden hover:text-slate-300 transition-colors"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="flex items-center">
            <FontAwesomeIcon
              icon={faComments}
              className="mr-3 text-emerald-500"
            />
            <span className="font-semibold">ChatApp by Fardin</span>
          </div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="hover:text-slate-300 transition-colors"
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
        </header>

        {settingsOpen && (
          <section className="p-6 bg-slate-800 text-white border-b border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-slate-300">
                Display Name
              </label>
              <input
                className="border border-slate-600 p-2.5 bg-slate-700 text-white rounded-lg w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </section>
        )}
        {/* mb-[76px] md:mb-[84px] */}
        <section className="flex-1 p-6 overflow-y-auto bg-slate-900 ">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 p-4 rounded-lg shadow-md ${getMessageColor(
                  msg.user
                )} text-white flex items-start transition-all hover:shadow-lg`}
              >
                <div className="flex items-start">
                  {getAvatar(msg.user)}
                  <div className="ml-3">
                    <div className="flex items-center gap-2">
                      <strong className="font-medium">{msg.user}</strong>
                      <span className="text-xs text-slate-400">{msg.time}</span>
                    </div>
                    {msg.file ? (
                      <div className="mt-1">
                        <a
                          href={msg.file}
                          download
                          className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          {msg.text}
                        </a>
                      </div>
                    ) : (
                      <div className="mt-1">{msg.text}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </section>

        <footer className="bottom-0 w-full p-4 bg-slate-800 border-t border-slate-700 flex items-center gap-2">
          <input
            className="flex-1 border border-slate-600 p-2 sm:p-3 rounded-lg bg-slate-700 text-white 
        focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base min-w-0"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
          />
          <label
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg 
        flex items-center cursor-pointer transition-colors min-w-[3rem] sm:min-w-[4rem] justify-center"
          >
            <FontAwesomeIcon icon={faFileUpload} />
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  sendFile(e.target.files[0]);
                }
              }}
            />
          </label>
          <button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg 
        flex items-center transition-colors min-w-[3rem] sm:min-w-[4rem] justify-center"
            onClick={sendMessage}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </footer>
      </main>
    </div>
  );
};

export default App;
