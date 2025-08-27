const root = document.getElementById('root');

async function fetchData() {
  const res = await fetch('flags_data.json');
  return await res.json();
}

function kmeans(data, k = 4, maxIter = 100) {
  // data: [{rgb: [r,g,b], ...}]
  let centroids = [];
  for (let i = 0; i < k; i++) {
    centroids.push(data[Math.floor(Math.random() * data.length)].rgb.slice());
  }
  let clusters = Array(data.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    // Assign clusters
    for (let i = 0; i < data.length; i++) {
      let dists = centroids.map(c => Math.sqrt(
        (data[i].rgb[0]-c[0])**2 + (data[i].rgb[1]-c[1])**2 + (data[i].rgb[2]-c[2])**2
      ));
      clusters[i] = dists.indexOf(Math.min(...dists));
    }
    // Update centroids
    let newCentroids = Array(k).fill().map(() => [0,0,0]);
    let counts = Array(k).fill(0);
    for (let i = 0; i < data.length; i++) {
      let cl = clusters[i];
      for (let j = 0; j < 3; j++) newCentroids[cl][j] += data[i].rgb[j];
      counts[cl]++;
    }
    for (let i = 0; i < k; i++) {
      if (counts[i]) for (let j = 0; j < 3; j++) newCentroids[i][j] /= counts[i];
      else newCentroids[i] = centroids[i];
    }
    if (JSON.stringify(centroids) === JSON.stringify(newCentroids)) break;
    centroids = newCentroids;
  }
  return {clusters, centroids};
}

function getClusterColors(k) {
  const palette = [
    'rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)', 'rgb(255,165,0)',
    'rgb(128,0,128)', 'rgb(0,255,255)', 'rgb(255,0,255)', 'rgb(128,128,0)'
  ];
  return palette.slice(0, k);
}

function renderPlot(data, clusters, centroids) {
  const k = centroids.length;
  const colors = getClusterColors(k);
  const traces = [];
  for (let i = 0; i < k; i++) {
    const clusterPoints = data.filter((_, idx) => clusters[idx] === i);
    traces.push({
      x: clusterPoints.map(d => d.rgb[0]),
      y: clusterPoints.map(d => d.rgb[1]),
      z: clusterPoints.map(d => d.rgb[2]),
      text: clusterPoints.map(d => d.state),
      customdata: clusterPoints.map(d => d.thumbnail),
      mode: 'markers+text',
      type: 'scatter3d',
      name: `Cluster ${i+1}`,
      marker: { size: 6, color: colors[i] },
      hovertemplate:
        '<b>%{text}</b><br>' +
        '<img src="%{customdata}" style="width:64px;height:40px;"><br>' +
        'R: %{x:.2f}, G: %{y:.2f}, B: %{z:.2f}<extra></extra>'
    });
    // Lines from centroid to each point in cluster
    clusterPoints.forEach(d => {
      traces.push({
        x: [centroids[i][0], d.rgb[0]],
        y: [centroids[i][1], d.rgb[1]],
        z: [centroids[i][2], d.rgb[2]],
        mode: 'lines',
        type: 'scatter3d',
        line: { color: colors[i], width: 1 },
        hoverinfo: 'skip',
        showlegend: false
      });
    });
  }
  // Centroids
  traces.push({
    x: centroids.map(c => c[0]),
    y: centroids.map(c => c[1]),
    z: centroids.map(c => c[2]),
    mode: 'markers',
    type: 'scatter3d',
    name: 'Centroids',
    marker: { size: 16, color: getClusterColors(k), symbol: 'diamond' },
    hovertemplate:
      '<b>Centroid</b><br>R: %{x:.2f}, G: %{y:.2f}, B: %{z:.2f}<extra></extra>'
  });
  Plotly.newPlot('plot3d', traces, {
    margin: {l:0, r:0, b:0, t:0},
    scene: {
      xaxis: {title: 'Red', range: [0,1]},
      yaxis: {title: 'Green', range: [0,1]},
      zaxis: {title: 'Blue', range: [0,1]},
    },
    showlegend: true,
    legend: {x:0, y:1}
  }, {responsive: true});
}

function renderClusterList(data, clusters, k) {
  const colors = getClusterColors(k);
  const clusterList = document.createElement('div');
  clusterList.className = 'cluster-list';
  for (let i = 0; i < k; i++) {
    const clusterDiv = document.createElement('div');
    clusterDiv.className = 'cluster';
    clusterDiv.innerHTML = `<h4 style="color:${colors[i]}">Cluster ${i+1}</h4>`;
    data.forEach((d, idx) => {
      if (clusters[idx] === i) {
        clusterDiv.innerHTML += `<div style="display:flex;align-items:center;margin-bottom:4px;"><img class="state-thumb" src="${d.thumbnail}" alt="${d.state}" style="margin-right:8px;"> <span>${d.state}</span></div>`;
      }
    });
    clusterList.appendChild(clusterDiv);
  }
  document.body.appendChild(clusterList);
}

fetchData().then(data => {
  const {clusters, centroids} = kmeans(data, 4);
  const plotDiv = document.createElement('div');
  plotDiv.id = 'plot3d';
  plotDiv.style = 'width:100vw;height:100vh;';
  root.appendChild(plotDiv);
  renderPlot(data, clusters, centroids);
  renderClusterList(data, clusters, 4);
});
