/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Header = () => {
  const location = useLocation();
  const [active, setActive] = useState(location.pathname);

  // Update active state when location changes
  useEffect(() => {
    setActive(location.pathname);
  }, [location.pathname]);

  const handleLinkClick = (path) => {
    setActive(path);
  };

  const navItems = [
    { label: "Overview", path: "/" },
    { label: "Solar", path: "/solar" },
    { label: "Mains", path: "/mains" },
    { label: "Genset", path: "/genset" },
    { label: "Alerts", path: "/alerts" },
  ];

  return (
    <header className="p-2 w-full bg-gradient-to-r from-custom-green to-custom-dark">
      <nav>
        <ul className="flex flex-wrap">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => handleLinkClick(item.path)}
              className="cursor-pointer"
            >
              <motion.li
                className={`px-5 py-2 transition-colors duration-300 text-lg relative ${
                  active === item.path ? "text-white" : "text-[#7A7F7F]"
                }`}
                initial={false}
                animate={{
                  color: active === item.path ? "#ffffff" : "#7A7F7F",
                }}
                whileHover={{
                  color: "#ffffff",
                  transition: { duration: 0.2 },
                }}
              >
                {item.label}
                {active === item.path ? (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C37C5A] rounded-full"
                    layoutId="underline-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                ) : (
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#0A3D38]" />
                )}
              </motion.li>
            </Link>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;

/*
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
    const location = useLocation(); // Get the current location
    const [active, setActive] = useState(location.pathname); // Initialize active state with current path

    // Function to handle click and set active state
    const handleLinkClick = (path) => {
        setActive(path);
    };

    return (
        <header className="p-2 w-full bg-gradient-to-r from-custom-green to-custom-dark">
            <nav>
                <ul className="flex flex-wrap">
                    <Link to="/" onClick={() => handleLinkClick("/")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg ${active === '/' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Overview
                        </li>
                    </Link>
                    <Link to="/solar" onClick={() => handleLinkClick("/solar")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg ${active === '/solar' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Solar
                        </li>
                    </Link>
                    <Link to="/mains" onClick={() => handleLinkClick("/mains")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg ${active === '/mains' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Mains
                        </li>
                    </Link>
                    <Link to="/genset" onClick={() => handleLinkClick("/genset")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg ${active === '/genset' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Genset
                        </li>
                    </Link>
                    <Link to="/alerts" onClick={() => handleLinkClick("/alerts")} className="cursor-pointer">
                        <li className={`px-5 py-2 transition-colors duration-300 text-lg ${active === '/alerts' ? 'text-white border-b-2 border-[#C37C5A]' : 'text-[#7A7F7F] border-b border-[#0A3D38]'}`}>
                            Alerts
                        </li>
                    </Link>
                </ul>
            </nav>
        </header>
    );
};

export default Header;
*/
