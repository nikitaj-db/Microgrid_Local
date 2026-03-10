import React from "react";
import { CiUser } from "react-icons/ci";
import { IoIosSearch } from "react-icons/io";
import { IoNotificationsOutline } from "react-icons/io5";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center w-full p-3 bg-gradient-to-r from-custom-green to-custom-dark">
      <div className="flex rounded overflow-hidden p-3 bg-[#030F0E] w-full max-w-md ml-5">
        <div className="bg-transparent border-none">
          <IoIosSearch color="white" className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none text-white outline-none ml-2 text-sm flex-grow opacity-65"
        />
      </div>

      <div className="flex items-center cursor-pointer mr-5">
        <div className="mr-3 w-7 h-7 bg-[#062A30] rounded-full flex items-center justify-center">
          <IoNotificationsOutline color="white" />
        </div>
        <div className="relative inline-block cursor-pointer group">
          <div className=" w-7 h-7 bg-[#062A30] rounded-full flex items-center justify-center">
            <CiUser color="white" className="transform scale-125" />
          </div>
          <div className="absolute right-0 hidden p-5 bg-[#0a3d38] rounded-md z-10 group-hover:block">
            <h1 className="text-white text-base whitespace-nowrap font-bold">
              Account Settings
            </h1>
            <div className="inline-flex items-center mt-2">
              <img
                src="./assets/Logout-Icon.png"
                alt=""
                width="15"
                height="15"
              />
              <button className="ml-2 text-white font-medium text-base">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
