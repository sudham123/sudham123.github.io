let data = [];  
d3.csv('data/exoplanets.csv').then(rows => {
  data = rows.map(d => ({
    name: d.name,
    distance: +d.distance,
    stellar_magnitude: +d.stellar_magnitude,
    planet_type: d.planet_type,
    discovery_year: +d.discovery_year,
    mass_multiplier: +d.mass_multiplier,
    mass_wrt: d.mass_wrt,
    radius_multiplier: +d.radius_multiplier,
    radius_wrt: d.radius_wrt,
    orbital_radius: +d.orbital_radius,
    orbital_period: +d.orbital_period,
    eccentricity: +d.eccentricity,
    detection_method: d.detection_method
  }));
  
  renderScene1();
  renderScene2();
  renderScene3();
  renderScene4();
  renderScene5();
});

function showScene(n) {
  d3.selectAll('.slide').classed('active', false);
  d3.select(`#scene-${n}`).classed('active', true);
}

d3.selectAll('.btn-next').on('click', function() {
  const current = d3.select(this.parentNode).attr('id').split('-')[1];
  const next = current === '5' ? '1' : (+current + 1).toString();
  showScene(next);
});

d3.selectAll('.btn-prev').on('click', function() {
  const current = d3.select(this.parentNode).attr('id').split('-')[1];
  const prev = current === '1' ? '5' : (+current - 1).toString();
  showScene(prev);
});

function renderScene1() {
  const imgUrls = [
    'data/image1.png',
    'data/image2.jpeg',
    'data/image3.jpeg',
    'data/image4.jpeg',
    'data/image5.jpeg',
    'data/image6.jpeg',
  ];
  const sel = d3.select('#scene1-images').selectAll('img')
    .data(imgUrls).enter()
    .append('img')
    .attr('src', d => d)
    .style('width', '200px')
    .style('margin', '10px');
}

function renderScene2() {
  const svg = d3.select('#scene2-chart').append('svg')
    .attr('width', 800).attr('height', 450); 
  
  function updateScene2() {
    const yearMax = +d3.select('#scene2-year-range').property('value');
    const selectedMethods = Array.from(d3.selectAll('#scene-2 .filter-group').nodes()[1].querySelectorAll('input'))
      .filter(n => n.checked)
      .map(n => n.value);
    
    d3.select('#scene2-year-display').text(yearMax);
    
    const filteredData = data.filter(d => 
      d.discovery_year <= yearMax && 
      selectedMethods.includes(d.detection_method)
    );
    
    const counts = d3.rollup(filteredData, v => v.length, d => d.planet_type);
    const items = Array.from(counts, ([type, count]) => ({type, count}))
      .filter(d => d.type !== 'Unknown'); 
    svg.selectAll('*').remove();
    
    if (items.length === 0) {
      svg.append('text')
        .attr('x', 350)
        .attr('y', 225)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ccd6f6')
        .text('No planets found with selected filters');
      return;
    }
    
    const width = 700, height = 450;
    const margin = {top: 30, right: 30, bottom: 90, left: 90};
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const x = d3.scaleBand()
      .domain(items.map(d => d.type))
      .range([0, chartWidth])
      .padding(0.3);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(items, d => d.count)])
      .nice()
      .range([chartHeight, 0]);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '12px');
    
    g.append('g')
      .call(d3.axisLeft(y));
    
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .text('Number of Planets');
    
    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .text('Planet Type');
    
    g.selectAll('rect')
      .data(items)
      .enter()
      .append('rect')
      .attr('x', d => x(d.type))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => chartHeight - y(d.count))
      .attr('fill', 'steelblue')
      .on('click', (event, d) => {
        const filtered = filteredData.filter(p => p.planet_type === d.type);
        d3.select('#scene2-info').text(
          `Type: ${d.type}, count: ${d.count} (up to ${yearMax}). Example: ${filtered[0]?.name || 'N/A'}`
        );
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('fill', '#63b3ed');
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`<strong>${d.type}</strong><br/>Count: ${d.count}<br/>Year: ≤${yearMax}`);
        
        tooltip.style('left', (event.pageX + 10) + 'px')
               .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('fill', 'steelblue');
        d3.selectAll('.tooltip').remove();
      });

    if (items.length > 0) {
      const highest = items.reduce((max, item) => item.count > max.count ? item : max);
      const lowest = items.reduce((min, item) => item.count < min.count ? item : min);
      
      g.append('text')
        .attr('x', x(highest.type) + x.bandwidth() / 2)
        .attr('y', y(highest.count) - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ff6b6b')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text('Most Common');
      
      g.append('line')
        .attr('x1', x(highest.type) + x.bandwidth() / 2)
        .attr('y1', y(highest.count) - 15)
        .attr('x2', x(highest.type) + x.bandwidth() / 2)
        .attr('y2', y(highest.count) - 5)
        .attr('stroke', '#ff6b6b')
        .attr('stroke-width', 1.5);
    }
  }
  
  d3.select('#scene2-year-range').on('input', updateScene2);
  d3.selectAll('#scene-2 .filter-group').nodes()[1].querySelectorAll('input').forEach(input => {
    input.addEventListener('change', updateScene2);
  });
  
  updateScene2();
}

function renderScene3() {
  const svg = d3.select('#scene3-chart').append('svg')
    .attr('width', 700).attr('height', 400);
  
  function updateScene3() {
    const selectedTypes = Array.from(d3.selectAll('#scene-3 .checkbox-group').nodes()[0].querySelectorAll('input'))
      .filter(n => n.checked)
      .map(n => n.value);
    
    const selectedMethods = Array.from(d3.selectAll('#scene-3 .checkbox-group').nodes()[1].querySelectorAll('input'))
      .filter(n => n.checked)
      .map(n => n.value);
    
    let filtered;
    if (selectedTypes.length === 0 && selectedMethods.length === 0) {
      filtered = [];
    } else {
      filtered = data.filter(d => {
        const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(d.planet_type);
        const methodMatch = selectedMethods.length === 0 || selectedMethods.includes(d.detection_method);
        return typeMatch && methodMatch;
      });
    }
    
    const years = d3.rollup(filtered, v => v.length, d => d.discovery_year);
    const items = Array.from(years, ([year, count]) => ({year, count}))
      .sort((a,b) => a.year - b.year);

    svg.selectAll('*').remove();
    
    if (items.length === 0) {
      svg.append('text')
        .attr('x', 350)
        .attr('y', 200)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ccd6f6')
        .text('Please select at least one filter to view data');
      return;
    }
    
    const margin = {top: 30, right: 30, bottom: 60, left: 80};
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const minYear = d3.min(items, d => d.year);
    const maxYear = d3.max(items, d => d.year);
    const maxCount = d3.max(items, d => d.count);
    
    const x = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([0, width]);
    
    const y = d3.scaleLinear()
      .domain([0, maxCount])
      .nice()
      .range([height, 0]);
    
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d3.format('d')));
    
    g.append('g')
      .call(d3.axisLeft(y));
    
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .text('Number of Discoveries');
    
    g.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .text('Discovery Year');
    
    if (filtered.length < 10) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ccd6f6')
        .style('font-size', '14px')
        .text(`Total: ${filtered.length} planets found`);
    }
    
    g.append('path')
      .datum(items)
      .attr('fill', 'none')
      .attr('stroke', '#1d8cf8')
      .attr('stroke-width', 3)
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => y(d.count))
      );
    
    g.selectAll('circle')
      .data(items)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.count))
      .attr('r', 4)
      .attr('fill', '#1d8cf8')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6);
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`<strong>${d.year}</strong><br/>Discoveries: ${d.count}`);
        
        tooltip.style('left', (event.pageX + 10) + 'px')
               .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('r', 4);
        d3.selectAll('.tooltip').remove();
      });

    if (items.length > 0) {
      const trendStart = items.filter(d => d.year >= 2010 && d.year <= 2012)
        .reduce((max, item) => item.count > max.count ? item : max);
      
      const annotationPoint = trendStart || items.filter(d => d.year >= 2013 && d.year <= 2014)
        .reduce((max, item) => item.count > max.count ? item : max);
      
      if (annotationPoint) {
        const annotationYear = annotationPoint.year;
        const annotationCount = annotationPoint.count;
        
        g.append('line')
          .attr('x1', x(annotationYear))
          .attr('y1', y(annotationCount) - 10)
          .attr('x2', x(annotationYear))
          .attr('y2', y(annotationCount) - 30)
          .attr('stroke', '#ff6b6b')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
        
        g.append('text')
          .attr('x', x(annotationYear))
          .attr('y', y(annotationCount) - 45)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ff6b6b')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text('NASA Kepler Mission');
      }
    }
  }
  
  d3.selectAll('#scene-3 input[type=checkbox]').on('change', updateScene3);
  
  updateScene3();
}

function scene3TypeFilters() {
  return Array.from(d3.selectAll('#scene-3 input[type=checkbox]')
    .filter((_,d,i,nodes) => i < d3.selectAll('#scene-3 .checkbox-group').nodes()[0].querySelectorAll('input').length)
    .nodes())
    .map(n => n.value)
    .filter((v,i,n) => nodes[i].checked);
}
function scene3MethodFilters() {
  return Array.from(d3.selectAll('#scene-3 .checkbox-group').nodes()[1].querySelectorAll('input'))
    .filter(n=>n.checked).map(n=>n.value);
}

function renderScene4() {
  const svg = d3.select('#scene4-chart').append('svg')
    .attr('width', 700).attr('height', 500);
  
  function updateScene4() {
    const selectedTypes = Array.from(d3.selectAll('#scene-4 .filter-group').nodes()[0].querySelectorAll('input'))
      .filter(n => n.checked)
      .map(n => n.value);
    
    const yearMax = +d3.select('#year-range').property('value');
    d3.select('#scene4-year-display').text(yearMax);
    
    const selectedMethods = Array.from(d3.selectAll('#scene-4 .filter-group').nodes()[2].querySelectorAll('input'))
      .filter(n => n.checked)
      .map(n => n.value);
    
    let filtered;
    if (selectedTypes.length === 0 && selectedMethods.length === 0) {
      filtered = [];
    } else {
      filtered = data.filter(d => {
        const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(d.planet_type);
        const yearMatch = d.discovery_year <= yearMax;
        const methodMatch = selectedMethods.length === 0 || selectedMethods.includes(d.detection_method);
        return typeMatch && yearMatch && methodMatch;
      });
    }
    
    filtered = filtered.filter(d => d.orbital_radius <= 1000);
    
    const filteredWithEarthMasses = filtered.map(d => {
      let earthMasses;
      
      if (d.mass_wrt === 'Jupiter') {
        earthMasses = d.mass_multiplier * 317.8;
      } else if (d.mass_wrt === 'Earth') {
        earthMasses = d.mass_multiplier;
      } else {
        earthMasses = d.mass_multiplier;
      }
      
      return {
        ...d,
        earth_masses: earthMasses
      };
    });
    
    svg.selectAll('*').remove();
    
    if (filteredWithEarthMasses.length === 0) {
      svg.append('text')
        .attr('x', 350)
        .attr('y', 250)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ccd6f6')
        .text('No data found with selected filters');
      return;
    }
    
    const margin = {top: 30, right: 30, bottom: 80, left: 80};
    const w = +svg.attr('width') - margin.left - margin.right;
    const h = +svg.attr('height') - margin.top - margin.bottom;
    
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleLinear()
      .domain([0, 500])
      .range([0,w]);
    
    const y = d3.scaleLinear()
      .domain([0, 10000])
      .nice()
      .range([h,0]);
    
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x));
    
    g.append('g')
      .call(d3.axisLeft(y));
    
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (h / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .text('Mass (Earth Masses)');
    
    g.append('text')
      .attr('transform', `translate(${w / 2}, ${h + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .text('Orbital Radius (AU)');
    
    g.append('text')
      .attr('x', w / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Planet Mass vs Orbital Distance (≤1000 AU)');
    
    g.selectAll('circle')
      .data(filteredWithEarthMasses)
      .enter()
      .append('circle')
      .attr('cx', d=> x(d.orbital_radius))
      .attr('cy', d=> y(d.earth_masses))
      .attr('r', 4)
      .attr('fill', '#1d8cf8')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6);
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`<strong>${d.name}</strong><br/>Mass: ${d.earth_masses.toFixed(1)} Earth masses<br/>Orbit: ${d.orbital_radius} AU<br/>Type: ${d.planet_type}<br/>Method: ${d.detection_method}`);
        
        tooltip.style('left', (event.pageX + 10) + 'px')
               .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('r', 4);
        d3.selectAll('.tooltip').remove();
      });
  }
  
  d3.selectAll('#scene-4 input[type=checkbox]').on('change', updateScene4);
  d3.select('#year-range').on('input', updateScene4);
  
  updateScene4();
}

function renderScene5() {
  const svg = d3.select('#scene5-chart').append('svg')
    .attr('width', 700).attr('height', 500);
  
  function updateScene5() {
    const selectedTypes = Array.from(d3.selectAll('#scene-5 .filter-group').nodes()[0].querySelectorAll('input'))
      .filter(n => n.checked)
      .map(n => n.value);
    
    const yearMax = +d3.select('#scene5-year-range').property('value');
    d3.select('#scene5-year-display').text(yearMax);
    
    const selectedMethods = Array.from(d3.selectAll('#scene-5 .filter-group').nodes()[2].querySelectorAll('input'))
      .filter(n => n.checked)
      .map(n => n.value);
    
    const distanceMin = +d3.select('#scene5-distance-min').property('value');
    const distanceMax = +d3.select('#scene5-distance-max').property('value');
    const magnitudeMin = +d3.select('#scene5-magnitude-min').property('value');
    const magnitudeMax = +d3.select('#scene5-magnitude-max').property('value');
    
    d3.select('#scene5-distance-min-display').text(distanceMin);
    d3.select('#scene5-distance-max-display').text(distanceMax);
    d3.select('#scene5-magnitude-min-display').text(magnitudeMin);
    d3.select('#scene5-magnitude-max-display').text(magnitudeMax);
    
    let filtered;
    if (selectedTypes.length === 0 && selectedMethods.length === 0) {
      filtered = [];
    } else {
      filtered = data.filter(d => {
        const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(d.planet_type);
        const yearMatch = d.discovery_year <= yearMax;
        const methodMatch = selectedMethods.length === 0 || selectedMethods.includes(d.detection_method);
        const distanceMatch = d.distance >= distanceMin && d.distance <= distanceMax;
        const magnitudeMatch = d.stellar_magnitude >= magnitudeMin && d.stellar_magnitude <= magnitudeMax;
        return typeMatch && yearMatch && methodMatch && distanceMatch && magnitudeMatch;
      });
    }
    
    filtered = filtered.filter(d => !isNaN(d.distance) && !isNaN(d.stellar_magnitude) && d.distance > 0 && d.stellar_magnitude > 0);
    
    svg.selectAll('*').remove();
    
    if (filtered.length === 0) {
      svg.append('text')
        .attr('x', 350)
        .attr('y', 250)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ccd6f6')
        .text('No data found with selected filters and ranges');
      return;
    }
    
    const margin = {top: 30, right: 30, bottom: 80, left: 80};
    const w = +svg.attr('width') - margin.left - margin.right;
    const h = +svg.attr('height') - margin.top - margin.bottom;
    
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleLinear()
      .domain([distanceMin, distanceMax])
      .range([0,w]);
    
    const y = d3.scaleLinear()
      .domain([magnitudeMin, magnitudeMax])
      .range([h,0]);
    
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x));
    
    g.append('g')
      .call(d3.axisLeft(y));
    
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (h / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .text('Stellar Magnitude');
    
    g.append('text')
      .attr('transform', `translate(${w / 2}, ${h + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .text('Distance (parsecs)');
    
    g.append('text')
      .attr('x', w / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Planet Distance vs Host Star Brightness');
    
    g.append('text')
      .attr('x', w / 2)
      .attr('y', h + margin.bottom + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ccd6f6')
      .style('font-size', '12px')
      .text(`${filtered.length} planets shown`);
    
    g.selectAll('circle')
      .data(filtered)
      .enter()
      .append('circle')
      .attr('cx', d=> x(d.distance))
      .attr('cy', d=> y(d.stellar_magnitude))
      .attr('r', 4)
      .attr('fill', '#1d8cf8')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6);
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px 12px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`<strong>${d.name}</strong><br/>Distance: ${d.distance.toFixed(1)} pc<br/>Stellar Magnitude: ${d.stellar_magnitude.toFixed(2)}<br/>Type: ${d.planet_type}<br/>Method: ${d.detection_method}`);
        
        tooltip.style('left', (event.pageX + 10) + 'px')
               .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('r', 4);
        d3.selectAll('.tooltip').remove();
      });
  }
  
  d3.selectAll('#scene-5 input[type=checkbox]').on('change', updateScene5);
  d3.select('#scene5-year-range').on('input', updateScene5);
  d3.select('#scene5-distance-min').on('input', updateScene5);
  d3.select('#scene5-distance-max').on('input', updateScene5);
  d3.select('#scene5-magnitude-min').on('input', updateScene5);
  d3.select('#scene5-magnitude-max').on('input', updateScene5);
  
  updateScene5();
}
