
const url = "/api/stateproduction"


d3.json(url).then(function(response) {
    console.log(response);
    // energy production column from string to numeric
    response.forEach(row => {
        row.energy_production_gwh = +row.energy_production_gwh 
    });

    // array of each fuel type
    const fuel_types = [...new Set(response.map(row => row.fuel_source))];
    console.log("fuel_type:", fuel_types);

    // array of each state
    const states = [...new Set(response.map(row => row.state))];
    console.log("states: ", states);

    // array of each financial year
    const fin_years = [...new Set(response.map(row => row.financial_year))];
    console.log("years: ", fin_years);

   // initialise dropbown menu of states
   const stateDropdown = d3.select("#selState")
   states.forEach(state => {
    var stateOption = stateDropdown.append("option").text(state)
   });

    // custom bar colours
    colors =['rgb(54, 54, 50)',
    'rgb(65, 66, 51)',
    'rgb(74, 78, 52)',
    'rgb(83, 91, 53)',
    'rgb(91, 104, 54)',
    'rgb(98, 118, 55)',
    'rgb(104, 132, 56)',
    'rgb(109, 147, 58)',
    'rgb(113, 162, 60)',
    'rgb(116, 177, 62)',
    'rgb(117, 193, 66)',
    'rgb(116, 209, 70)',
   ]

   // the first year of data will be used throughout to set up the graph
   const startYear = fin_years[0]

    // function to get total energy output for a particular state and year
    function getStateTotal(data, year, state) {
        const state_production = data.filter((v,i) => {
            return (v["financial_year"] == year && v["state"] == state)
        });
        const state_total = state_production.reduce((accumulator, object) => {
            return accumulator + object.energy_production_gwh
        }, 0);
        return state_total  
    };
     // function to return highest output of a fuel to set y axis
    function getStateTotal(data, year, state) {
        const state_production = data.filter((v,i) => {
            return (v["financial_year"] == year && v["state"] == state)
        });
        const state_total = state_production.reduce((accumulator, object) => {
            return accumulator + object.energy_production_gwh
        }, 0);
        return state_total  
    };
    
    // function to return output of each fuel for a particular state and year
    function fuelOutput(data, year, state, fuels) {
        var production = []
        fuels.forEach(fuel => {
            var fuelOutput = data.filter((v, i) => {
                return (v["financial_year"] == year && v["state"] == state && v["fuel_source"] == fuel)
            });
            production.push(fuelOutput[0].energy_production_gwh)
        });
        return production
    };

    // function to create trace for bar graph
    // each trace is a state for a particular year
    // x values: each fuel source
    // y values: energy output
    function createTrace(data, year, state, fuels) {
        x_values = fuels;
        y_values = fuelOutput(data, year, state, fuels)
        var trace ={
            x: x_values,
            y: y_values,
            marker: {color: colors},
            text: y_values.map(String),
            textposition: 'auto',
            name: state,
            type: 'bar'
        };
        console.log("trace: ", trace)
        return trace
    };

    // function to create steps
    // steps are labels on the slider used to change the graph
    // each step will be a financial year
    // the steps will also use the animate method to change frames - each frame a different year
    function createStep(year) {
        step = {}
        step["label"] = year,
        step["method"] = 'animate',
        step["args"] = [[year], {
            mode: 'immediate',
            transition: {duration: 300},
            frame: {duration: 1200, redraw: false},
        }]
        return step
    };

    // function to create frames
    // each frame is similar to a trace, but contains only the data that needs to change
    // one frame for each change that will take place. this case the y values (the fuel production for the changed year)
    function createFrame(data, year, state, fuels) {
        var y_values = fuelOutput(data, year, state, fuels)
        var frame ={
            name: year,
            data: [{
                y: y_values,
                text: y_values.map(String),
                textposition: 'auto',
                }
            ]};

        return frame
    };

    // function to create graph
    function createGraph(data, startYear, fuels) {
        const state = stateDropdown.property("value")
        // create initial trace. changes to trace will be made through frames
        var traces =[]
        traces.push(createTrace(data, startYear, state, fuels))

        // create frames. each frame is data to change for each year selected
        var frames = []
        fin_years.forEach(finyear => {
            var frame = createFrame(data, finyear, state, fuels)
            frames.push(frame)
        })
        
        // create slider step for each year
        var sliderSteps = []
        fin_years.forEach(finyear => {
            var step = createStep(finyear)
            sliderSteps.push(step)
        });

        var layout = {
            title: `${state} energy production mix`,
            height: 800,
            sliders: [{
                activebgcolor: 'rgb(219, 7, 61)',
                currentvalue: {
                    prefix: 'Financial Year: ',
                    xanchor: 'left',
                    font: {size: 25, color: '#231'}
                },
                pad: {t:100, l: 150, r:25},
                steps: sliderSteps,
                transition: {easing: "exp"}                
            }],
            updatemenus: [{
                type: 'buttons',
                x: 0,
                y:0,
                pad: {t:125, r:50},
                yanchor: 'top',
                xanchor: 'left',
                direction: 'left',
                buttons: [{
                    label: 'Play',
                    method: 'animate',
                    args: [null, {
                        mode: 'immediate',
                        fromcurrent: true,
                        transition: {duration: 300},
                        frame: {duration: 1200, redraw: false}
                    }]
                }, {
                    label: 'Pause',
                    method: 'animate',
                    args: [[null], {
                        mode: 'immediate',
                        transition: {duration: 0},
                        frame: {duration: 0, redraw: false}
                    }]
                }]
            }]
        };          
                        
        Plotly.newPlot('dbtest',{
            data: traces,
            layout: layout,
            frames: frames
        })
    };

    function updateGraph(data, startYear, years, fuels) {
        // set state as selected
        const state = stateDropdown.property("value")
        console.log("value: ", stateDropdown.property("value"))
        // change existing trace to that of new state
        const y_values = fuelOutput(data, startYear, state, fuels)
        const data_update = {
            y: [y_values],
            name: state,
        };

        const layout_update = {
            title: `${state} energy production mix`,
        }
        Plotly.update('dbtest', data_update, layout_update)
        // create new frames for the new state
        frames = []
        years.forEach(finyear => {
            var frame = createFrame(data, finyear, state, fuels)
            frames.push(frame)
        })

        Plotly.addFrames('dbtest', frames)



    }

    // create graph on landing and set up event change
    createGraph(response, startYear, fuel_types)
    // update the graph when the state is changed
   stateDropdown.on("change", function() {
    updateGraph(response, startYear, fin_years, fuel_types)
   });
});