import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const ProgressBar = ({ fuellevel }) => {
  // console.log("Received value:", fuellevel);

  const ref = useRef();
  const [filledValue, setFilledValue] = useState(1);

  // Configuration
  const totalBars = 8;

  // Calculate filled bars
  const calculateFilledBars = (value) => {
    let filledValue = 0;

    // For values from 0 to 100 (increments of 10 per bar)
    if (value <= 100) {
      filledValue = Math.min(Math.ceil(value / 12.5), totalBars);
    }
    // For values from 0 to 1000 (increments of 100 per bar)
    else if (value <= 1000) {
      filledValue = Math.min(Math.ceil(value / 125), totalBars);
    }

    // console.log(`Value: ${value}, Filled Bars: ${filledValue}`);
    setFilledValue(filledValue);
  };

  // Draw the chart
  useEffect(() => {
    calculateFilledBars(fuellevel);
    drawChart();
  }, [fuellevel, filledValue]);


  const drawChart = () => {
    // console.log(window.innerWidth, window.innerHeight)
    const svgWidth = window.innerWidth >= 1900 ? 280 : 200;
    const svgHeight = window.innerHeight >= 900 ? 180 : 110;
    const lineHeightIncrement = window.innerWidth >= 1900 ? 12 : 8;
    const numberOfLines = 8;
    const emptyColor = "#606060";
    const rectWidth = window.innerWidth >= 1900 ? 24 : 18;
    const rectRadius = 4;
    const gap = 5;

    // Clear the previous SVG content
    d3.select(ref.current).select("svg").remove();

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .style("display", "block")
      .style("margin", "0 auto");

    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    // Define the gradient colors
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#FD9C2B");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#FD9C2B");

    const lineGroup = svg
      .append("g")
      .attr(
        "transform",
        `translate(${(svgWidth - (numberOfLines * (rectWidth + gap))) / 2}, ${svgHeight - 20
        })`
      );

    // Create bars
    for (let i = 0; i < numberOfLines; i++) {
      const rectHeight = (i + 1) * lineHeightIncrement + 10;

      lineGroup
        .append("rect")
        .attr("x", i * (rectWidth + gap))
        .attr("y", -rectHeight)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("fill", i < filledValue ? "url(#gradient)" : emptyColor)
        .attr("rx", rectRadius)
        .attr("ry", rectRadius);
    }
  };

  return (
    <div
      className="flex items-center justify-center w-full h-full"
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    ></div>
  );
};

export default ProgressBar;
