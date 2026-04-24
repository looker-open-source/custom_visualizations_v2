// Note: This assumes d3 is imported or available in your visualization environment
looker.plugins.visualizations.add({
  options: {
    font_size: {
      type: "string",
      label: "Font Size",
      values: [{ Large: "large" }, { Small: "small" }],
      display: "radio",
      default: "large",
    },
  },

  create: function (element, config) {
    // Clear Looker's default element container
    element.innerHTML = "";

    // Set up our persistent D3 SVG canvas
    this.svg = d3
      .select(element)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%");
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {
    // Clear any previous Looker errors
    this.clearErrors();

    if (
      queryResponse.fields.dimensions.length === 0 ||
      queryResponse.fields.measures.length === 0
    ) {
      this.addError({
        title: "Missing Data",
        message: "This chart requires at least one dimension and one measure.",
      });
      done(); // Call done() before early return
      return;
    }

    if (!data || data.length === 0) {
      this.addError({
        title: "No Data",
        message: "The query returned no results.",
      });
      done();
      return;
    }

    // Check if this is a headless browser export (PDF/PNG)
    const isExport = details && details.print === true;

    // Clear previous D3 elements before redrawing
    this.svg.selectAll("*").remove();

    const width = element.clientWidth;
    const height = element.clientHeight;

    // Grab the first measure value to determine the size of our visualization
    const firstRow = data[0];
    const measureName = queryResponse.fields.measures[0].name;
    const measureValue = firstRow[measureName].value;

    // Create a circle in the center of the screen
    const targetRadius = Math.max(
      0,
      Math.min(measureValue || 0, Math.min(width, height) / 2 - 10),
    );

    const circle = this.svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("fill", config.font_size === "small" ? "#88C8F3" : "#008CD4"); // Using config just as a demo

    if (isExport) {
      // INSTANT RENDER FOR PDF EXPORTS
      // Draw the final state immediately with no transitions.
      circle.attr("r", targetRadius);

      // Tell Looker to take the screenshot right now.
      done();
    } else {
      // ANIMATED RENDER FOR BROWSER
      // Start with a radius of 0 and transition to the target radius
      circle
        .attr("r", 0)
        .transition()
        .duration(1000) // 1 second animation
        .attr("r", targetRadius)
        .on("end", () => {
          // Tell Looker the animation is finished
          done();
        });
    }
  },
});
