/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPieChart } from "react-icons/fi";
import { LuSettings } from "react-icons/lu";

const Sidebar = () => {
  const location = useLocation();
  const [path, setPath] = useState("/");

  useEffect(() => {
    if (location.pathname !== "/excel") {
      setPath(location.pathname);
    }
  }, [location.pathname]);

  return (
    <motion.div
      className="fixed left-0 top-0 w-14 h-full bg-[#030F0E] pt-2 transition-width duration-300"
      initial={{ x: -56 }}
      animate={{ x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <ul className="flex flex-col items-center space-y-8">
        <motion.li
          className="my-3"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Link to="/">
            <img
              src="./assets/Logo_N.png"
              alt="Dashboard"
              className="w-4 h-6"
            />
          </Link>
        </motion.li>

        <motion.li
          className="mt-2"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Link to={path}>
            <motion.div
              animate={{
                color: ["/solar", "/mains", "/genset", "/alerts", "/"].includes(
                  path
                )
                  ? "#ffffff"
                  : "#7A7F7F",
              }}
              transition={{ duration: 0.3 }}
            >
              <FiPieChart className="w-5 h-5" />
            </motion.div>
          </Link>
        </motion.li>

        {/* <motion.li
          className="mt-2"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Link to="/excel">
            <motion.img
              src="./assets/Rename.png"
              alt="Excel"
              className="w-4 h-5"
              animate={{
                filter:
                  location.pathname === "/excel"
                    ? "brightness(1.5)"
                    : "brightness(1)",
              }}
              transition={{ duration: 0.3 }}
            />
          </Link>
        </motion.li> */}
      </ul>
    </motion.div>
  );
};

export default Sidebar;

/*import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiPieChart } from "react-icons/fi";
import { LuSettings } from "react-icons/lu";

const Sidebar = () => {
  const location = useLocation();
  //console.log(location.pathname)

  const [path, setPath] = useState('/');

  useEffect(() => {
    if (location.pathname !== '/excel') {
      setPath(location.pathname)
    }
  }, [location.pathname])
  return (
    <div className="fixed left-0 top-0 w-14 h-full bg-[#030F0E] pt-2 transition-width duration-300">
      <ul className="flex flex-col items-center space-y-6">
        <li className="my-3">
          <Link to="/">
            <img src="./assets/Logo_N.png" alt="Dashboard" className="w-4 h-6" />
          </Link>
        </li>
        <li className="mt-2">
          <Link to={path}>
            <FiPieChart color='white' className='w-5 h-5' />
          </Link>
        </li>
        <li className="mt-2">
          <Link to="/excel">
            <img src="./assets/Rename.png" alt="Dashboard" className="w-4 h-5" />
          </Link>
        </li>
        <li className="mt-2">
          <Link to="#">
            <LuSettings color='#7A7F7F' className='w-5 h-5' />
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
*/
