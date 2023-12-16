
console.log("Let's go!");

let elevationLow = 9000;
let elevationHigh = 14000;

function seedRandom(seed) {
    var mask = 0xffffffff;
    var m_w  = (123456789 + seed) & mask;
    var m_z  = (987654321 - seed) & mask;

    return function() {
      m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
      m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;

      var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
      result /= 4294967296;
      return result;
    }
}

function aspectToRadians(key, id) {
    var seed = seedRandom(id);
    if (key === 'E') {
        return (seed() * 45 - 22.5) * Math.PI / 180;
    }
    else if (key === 'SE') {
        return (seed() * 45 + 22.5) * Math.PI / 180;
    }
    else if (key === 'S') {
        return (seed() * 45 + 67.5) * Math.PI / 180;
    }
    else if (key === 'SW') {
        return (seed() * 45 + 112.5) * Math.PI / 180;
    }
    else if (key === 'W') {
        return (seed() * 45 + 157.5) * Math.PI / 180;
    }
    else if (key === 'NW') {
        return (seed() * 45 + 202.5) * Math.PI / 180;
    }
    else if (key === 'N') {
        return (seed() * 45 + 247.5) * Math.PI / 180;
    }
    else if (key === 'NE') {
        return (seed() * 45 + 292.5) * Math.PI / 180;
    }
}

function jitterElevation(elevation, id) {
    var seed = seedRandom(id);
    return elevation + seed() * 100 - 50;
    }

let dSizeToPoint = {
    'D1':1,
    'D1.5':1.5,
    'D2':2,
    'D2.5':2.5,
    'D3':3,
    'D3.5':3.5,
    'D4':4,
    'D4.5':4.5,
    'D5':5
};

let dSizeToPointLegend = {
    'D1':1,
    'D2':2,
    'D3':3,
    'D4':4,
    'D5':5
};

let data = [
	{id: 1, date:'2023-11-25', count: 1, elevation:9500, aspect: 'E', Dsize:'D1', transparency:0.7, trigger:"skier", mountain:"Emmons", url:"https://youtu.be/BBJa32lCaaY?si=Fnwy0ILYCoOdbi0j"},
	{id: 2, date:'2023-12-03', count: 2, elevation:9500, aspect: 'SE', Dsize:'D4', transparency:0.5, trigger:"boarder", mountain:"Axtell", url:"https://www.youtube.com/watch?v=pdO-jllFqmA"},
    {id: 3, date:'2023-12-04', count: 1, elevation:12800, aspect: 'N', Dsize:'D2', transparency:0.1, trigger:"boarder", mountain:"Coneys", url:"https://www.youtube.com/watch?v=DDUe9BFPrzg&t=1s"},
    {id: 4, date:'2023-12-12', count: 1, elevation:10300, aspect: 'W', Dsize:'D2', transparency:0.1, trigger:"sled", mountain:"Coneys", url:"https://www.youtube.com/watch?v=DDUe9BFPrzg&t=1s"},
  ];

let parseDate = d3.timeParse("%Y-%m-%d"); // Adjust date format as needed
let dates = data.map(d => parseDate(d.date));
let endDate = d3.max(dates);
let startDate = d3.timeWeek.offset(endDate, -4);

// Create transparency scale
let transparencyScale = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0.1, 1]); 

 // Define color schemes
 let colorSchemes = {
    'trigger': d3.schemeCategory10,
    'mountain': d3.schemeAccent,
    // Add more color schemes as needed
};

let newData = [];

data.forEach(d => {
    for (let i = 0; i < d.count; i++) {
        newData.push({...d});
    }
});

let rowNumbers = {};

newData.forEach(d => {
    if (!(d.id in rowNumbers)) {
        rowNumbers[d.id] = 1;
    } else {
        rowNumbers[d.id]++;
    }

    d.avyNum = rowNumbers[d.id];
});


 // Map the aspect values in the data to radians
newData.forEach(d => {
    d.theta = aspectToRadians(d.aspect, d.id + d.avyNum);
    d.size = 5*dSizeToPoint[d.Dsize];
    d.r = jitterElevation(d.elevation, d.id + d.avyNum);
});

console.log(newData);

// 3. Create a SVG container
let svg = d3.select("body").append("svg")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight)
    .append("g")
    .attr("transform", `translate(${window.innerWidth / 2},${window.innerHeight / 2})`);

// 4. Define the scale for the radial graph
let rScale = d3.scaleLinear()
    .domain([elevationLow, elevationHigh])
    .range([250, 0]);


// Define the updateColorScheme function

console.log(data);

// Define the radial axis
let rAxis = g => g
    .attr("text-anchor", "middle")
    .call(g => g.append("g")
        .selectAll("g")
        .data(rScale.ticks(5))
        .join("g")
            .attr("fill", "none")
            .call(g => g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.5)
                .attr("r", rScale))
            .call(g => g.append("text")
                .attr("x", d => rScale(d) * Math.cos(Math.PI / 8))
                .attr("y", d => rScale(d) * Math.sin(Math.PI / 8))
                .attr("dy", "0.35em")
                .attr("stroke", "#fff")
                .attr("stroke-width", 5)
                .text(rScale.tickFormat(5, "s"))
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none")));



svg.append("g")
    .call(rAxis);

// Create a tooltip
let tip = d3.tip()
    .attr('class', 'd3-tip')
    .style('background-color', 'white')
    .style('border', '1px solid black')
    .style('padding', '10px')
    .offset([-10, 0])
    .html(function(d) {
        return `id: ${d.id}<br>obs id: ${d.avyNum}/${d.count}<br>date: ${d.date}<br>elevation: ${d.elevation}<br>aspect: ${d.aspect}<br>size: ${d.Dsize}<br>trigger: ${d.trigger}<br>mountain: ${d.mountain}<br><a href="${d.url}" target="_blank">url: ${d.url}</a>`;
    });

svg.call(tip);


// Create initial color scale
let colorScale = colorSchemes['trigger'];

// 8. Draw the points
newData.forEach(d => {
    let circle = svg.append("circle")
        .datum(d) // Ensure the data object d is associated with the circle
        .attr("cx", rScale(d.r) * Math.cos(d.theta))
        .attr("cy", rScale(d.r) * Math.sin(d.theta))
        .attr("r", d.size)
        .style("opacity", d => transparencyScale(parseDate(d.date)))
        .attr("fill", colorScale.trigger) // Color the circle based on the trigger variable
        .on('mouseover', function(d) {
            if (!d3.select(this).classed('clicked')) {
                tip.show(d, this);
            }
        })
        .on('mouseout', function(d) {
            if (!d3.select(this).classed('clicked')) {
                tip.hide(d, this);
            }
        })
        .on('click', function(d) {
            d3.event.stopPropagation(); // Stop the click event from bubbling up to the body
            d3.selectAll('circle').classed('clicked', false);
            d3.select(this).classed('clicked', true);
            tip.show(d, this);
        });
        
    circle.append("title")
        .text(`r: ${d.r}, theta: ${d.theta}, size: ${d.size}, transparency: ${d.transparency}`);
});


// Hide the tooltip when the user clicks somewhere else
d3.select("body").on("click", function() {
    let target = d3.event.target;
    if (!target.classList.contains('d3-tip') && !target.parentNode.classList.contains('d3-tip')) {
        tip.hide();
    }
});



// Create theta ticks
let thetaTicks = svg.selectAll(".thetaTick")
    .data(d3.range(Math.PI / 8, 2 * Math.PI, Math.PI / 4)) // 8 ticks starting at pi/8 with intervals of pi/4
    .enter().append("g")
    .attr("class", "thetaTick")
    .attr("transform", d => `rotate(${((d + Math.PI / 4) * 180 / Math.PI - 90)})`); 

thetaTicks.append("line")
    .attr("x2", 250)
    .style("stroke", "#ccc")
    .style("stroke-dasharray", "2,2");

let colorLegend = svg.selectAll(".colorLegend")
    // .data(colorScale.domain())
    .enter().append("g")
    .attr("class", "colorLegend")
    .attr("transform", (d, i) => `translate(${-window.innerWidth/2+20},${i * 30 + window.innerHeight/2-100})`);

colorLegend.append("circle") // Use "circle" instead of "rect"
    .attr("r", 10) // Set the radius of the circles
    .attr("cx", 10) // Adjust as needed
    .attr("cy", 10) // Adjust as needed
    .style("fill", d => colorScale(d))

colorLegend.append("text")
    .attr("x", 24)
    .attr("y", 10)
    .attr("dy", ".35em")
    .text(d => d);

// Update the color scheme
function updateColorScheme(colorScheme) {
    colorScale = d3.scaleOrdinal(colorSchemes[colorScheme]);
    svg.selectAll("circle")
        .attr("fill", function(d) {
            // Check if the colorScheme property exists in the data object
            if (d.hasOwnProperty(colorScheme)) {
                return colorScale(d[colorScheme]); // Update the color of the circles based on the selected variable
            } else {
                return "#fff"; // Default color if the colorScheme property doesn't exist
            }
        });

        // Update color legend
    let colorLegend = svg.selectAll(".colorLegend")
    .data(colorScale.domain());

    // Exit old elements
    colorLegend.exit().remove();

    // Enter new elements
    let colorLegendEnter = colorLegend.enter().append("g")
        .attr("class", "colorLegend")
        .attr("transform", (d, i) => `translate(${-window.innerWidth/2+20},${i * 30 + window.innerHeight/2-100})`);

    colorLegendEnter.append("circle")
        .attr("r", 10)
        .attr("cx", 10)
        .attr("cy", 10)
        .style("fill", d => colorScale(d));

    colorLegendEnter.append("text")
        .attr("x", 24)
        .attr("y", 10)
        .attr("dy", ".35em")
        .text(d => d);

    // Merge enter and update selections
    colorLegend = colorLegend.merge(colorLegendEnter);

    // Update existing elements
    colorLegend.select("circle").style("fill", d => colorScale(d));
    colorLegend.select("text").text(d => d);
}

// // Function to update color legend
function updateColorLegend(scheme) {
    // Check if the color scheme exists
    if (!colorSchemes[scheme]) {
        console.error(`Color scheme "${scheme}" does not exist.`);
        return;
    }
    // Update color scale
    colorScale = d3.scaleOrdinal(colorSchemes[scheme]);
    console.log(`scheme: ${scheme}`);
    // Update color legend
    colorLegend.select("circle").style("fill", colorScale);
    colorLegend.select("text").text(d => d);
}


// Create size legend
let sizeLegend = svg.selectAll(".sizeLegend")
    .data(Object.entries(dSizeToPointLegend))
    .enter().append("g")
    .attr("class", "sizeLegend")
    .attr("transform", (d, i) => {
        console.log(`i: ${i}, d[1]: ${d[1]**2}`); // Debug statement
        return `translate(${window.innerWidth/2 - 75},${140 + i * 10 + 10 * d[1] ** 1.75})`;
    }); // Adjust these values as needed

sizeLegend.append("circle")
    .attr("r", d => d[1] * 5) // Adjust the multiplier as needed
    .attr("cx", -20) // Adjust as needed
    .attr("cy", d => -d[1] * 5)
    .style("fill", "black");

sizeLegend.append("text")
    .attr("x", 24)
    .attr("y", 0)
    .attr("dy", ".35em")
    .text(d => `${d[0]}`)
    .attr("transform", (d, i) => {
        return `translate(0,${i*-5-7})`;
    });


// Create a dropdown for the color schemes
let dropdown = d3.select("body").append("select")
    .style("position", "absolute")
    .style("left", "50%")
    .style("top", "50px")
    .style("transform", "translate(-50%, 0)");

dropdown.selectAll("option")
    .data(Object.keys(colorSchemes)) 
    .enter().append("option")
    .attr("value", d => d)
    .text(d => d);

dropdown.on("change", function() {
    let scheme = d3.select(this).property("value");

    if (colorSchemes[scheme]) {
        // Use the color scale
        colorScale = colorSchemes[scheme];

        // Update color legend
        updateColorScheme(scheme);
        updateColorLegend(scheme);
    } else {
        console.error(`Color scheme "${scheme}" does not exist.`);
    }

});



let labels = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
let radius = 260; // Adjust as needed

labels.forEach((label, i) => {
    let angle = i * Math.PI / 4;
    let x = radius * Math.cos(angle);
    let y = radius * Math.sin(angle);

    svg.append('text')
        .attr('x', x)
        .attr('y', y)
        .text(label)
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'central');
});


updateColorLegend('trigger');
updateColorScheme('trigger');