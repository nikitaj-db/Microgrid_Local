/* eslint-disable no-unused-vars */
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Components/Sidebar";
import Navbar from "./Components/Navbar";
import Header from "./Components/Header";
import Overview from "./Screens/Overview";
import Solar from "./Screens/Solar";
import Mains from "./Screens/Mains";
import Genset from "./Screens/Genset";
import Alerts from "./Screens/Alert";
// import Excel from "./Screens/Excel";
import "./App.css";

// Create a separate component to access useLocation inside Router
const AppContent = () => {
  const location = useLocation();
  const BaseUrl = "http://localhost:5002/micro";

  return (
    <div className="flex h-screen custom-body">
      <Sidebar />
      <div className="flex flex-col flex-grow ml-12 transition-all duration-300">
        <Navbar />
        <Header />
        <div className="content flex-grow p-2 bg-gradient-to-r from-custom-green to-custom-dark">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <AnimatedWrapper>
                    <Overview BaseUrl={BaseUrl} />
                  </AnimatedWrapper>
                }
              />
              <Route
                path="/solar"
                element={
                  <AnimatedWrapper>
                    <Solar BaseUrl={BaseUrl} />
                  </AnimatedWrapper>
                }
              />
              <Route
                path="/mains"
                element={
                  <AnimatedWrapper>
                    <Mains BaseUrl={BaseUrl} />
                  </AnimatedWrapper>
                }
              />
              <Route
                path="/genset"
                element={
                  <AnimatedWrapper>
                    <Genset BaseUrl={BaseUrl} />
                  </AnimatedWrapper>
                }
              />
              <Route
                path="/alerts"
                element={
                  <AnimatedWrapper>
                    <Alerts BaseUrl={BaseUrl} />
                  </AnimatedWrapper>
                }
              />
              {/* <Route
                path="/excel"
                element={
                  <AnimatedWrapper>
                    <Excel BaseUrl={BaseUrl} />
                  </AnimatedWrapper>
                }
              /> */}
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

// Animated wrapper component for page transitions
const AnimatedWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{
        type: "tween",
        ease: "easeInOut",
        duration: 0.5,
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default App;
