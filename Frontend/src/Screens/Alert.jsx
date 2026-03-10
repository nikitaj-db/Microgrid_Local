/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";

const Alert = ({ BaseUrl }) => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${BaseUrl}/alert`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      //  console.log(data)

      const now = new Date();
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(now.getDate() - 5);

      const parseDateTime = (dateTimeString) => {
        const [datePart, timePart] = dateTimeString.split(" | ");
        const [day, month, year] = datePart.split("-").map(Number);
        const dateFormatted = `${month}-${day}-${"20" + year} ${timePart}`;
        return new Date(dateFormatted);
      };

      const recentNotifications = data.filter((notification) => {
        const notificationDate = parseDateTime(notification.date_time);
        return notificationDate >= fiveDaysAgo;
      });

      // console.log(recentNotifications);

      setNotifications(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const link = window.location.href;
    if (link.includes("alert")) {
      const ele = document.getElementById("alert");
      if (ele) {
        ele.style.borderBottom = "2px solid #C37C5A";
      }
    }
  }, []);

  return (
    <div className="p-2">
      <div className="m-2 mb-10">
        <div className="text-white text-xl font-bold">
          <div className="mb-2 flex justify-between mt-5">
            <span>Notifications</span>
            <button className="border-2 border-[#24514D] rounded-lg px-4 py-2 text-[#68BFB6] text-base flex items-center bg-transparent p-1">
              All
              <img src="assets/Polygon 1.png" alt="" className="ml-2" />
            </button>
          </div>
          <div className="max-h-[500px] xl:max-h-[710px] overflow-y-auto rounded-lg scrollbar-custom">
            <table className="w-full border-collapse text-[#CACCCC] text-xs xl:text-sm text-start">
              <thead className="bg-[#051E1C] text-left sticky top-0 z-20 text-[#68BFB6]">
                <tr>
                  <th className="px-4 xl:px-5 py-3 xl:py-4 whitespace-nowrap">
                    Fault Code
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">Categories</th>
                  <th className="px-4 py-3 whitespace-nowrap">Description</th>
                  <th className="px-4 py-3 whitespace-nowrap">Severity</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Date & Time</th>
                </tr>
              </thead>
              <tbody
                className="bg-[#030F0E] capitalize font-light"
                id="alert-container"
              >
                {Array.isArray(notifications) ? (
                  notifications
                    .slice()
                    .reverse()
                    .map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 xl:px-5 py-3 xl:py-4">
                          {item.fault_code}
                        </td>
                        <td className="px-4 py-3">{item.category}</td>
                        <td className="px-4 py-3">{item.description}</td>
                        <td
                          className={`px-4 py-3 whitespace-nowrap ${
                            item.severity.toLowerCase() === "alert"
                              ? "severity-alert"
                              : item.severity.toLowerCase() === "shutdown"
                              ? "severity-shutdown"
                              : ""
                          }`}
                        >
                          {item.severity}
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{
                            color:
                              item.status.toLowerCase() === "open"
                                ? "#EB5757"
                                : "#57EB66",
                          }}
                        >
                          {item.status}
                        </td>
                        <td className="px-4 py-3">{item.date_time}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-center">
                      No notifications available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;
