document.addEventListener('DOMContentLoaded', function() {
    // URLs dos arquivos de dados
    const dataUrl = './Data/dados_dashboard_long_format.csv';
    const geoDelegaciasUrl = './Data/delegacias_geo.csv';
    const geoJsonUrl = 'https://raw.githubusercontent.com/codigourbano/distritos-sp/master/distritos-sp.geojson';

    const monthOrder = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const selectors = {
        ano: '#ano-filter', mes: '#mes-filter', delegacia: '#delegacia-filter',
        ocorrencia: '#ocorrencia-filter', barChart: '#bar-chart-delegacias',
        donutChart: '#donut-chart-ocorrencias', lineChart: '#line-chart-tendencia',
        heatmap: '#heatmap-chart', map: '#map-chart', kpi: '#kpi-total h3',
    };

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    Promise.all([
        d3.dsv(";", dataUrl, d => ({...d, Ano: +d.Ano, Ocorrencias: +d.Ocorrencias})),
        d3.json(geoJsonUrl),
        d3.dsv(";", geoDelegaciasUrl, d => ({...d, Latitude: +d.Latitude, Longitude: +d.Longitude}))
    ]).then(([data, geojson, geoDelegacias]) => {
        populateFilters(data);
        addEventListeners(data, geojson, geoDelegacias);
        updateDashboard(data, geojson, geoDelegacias);
    }).catch(error => {
        console.error("ERRO ao carregar dados. Verifique o console.", error);
        d3.dsv(";", dataUrl, d => ({...d, Ano: +d.Ano, Ocorrencias: +d.Ocorrencias})).then(data => {
            alert("AVISO: Não foi possível carregar os dados de geolocalização. O mapa não será exibido.");
            populateFilters(data);
            addEventListeners(data, null, null);
            updateDashboard(data, null, null);
        });
    });

    function addEventListeners(data, geojson, geoDelegacias) {
        d3.selectAll('.filters select').on('change', () => updateDashboard(data, geojson, geoDelegacias));
    }
    
    function updateDashboard(data, geojson, geoDelegacias) {
        const filters = getFilterValues();
        const filteredData = filterData(data, filters);
        
        updateKPI(filteredData);
        updateBarChart(filteredData);
        updateDonutChart(filteredData);
        updateLineChart(filteredData);
        updateHeatmap(filteredData);
        if (geojson) {
            updateMap(filteredData, geojson, geoDelegacias || []);
        }
    }

    // ... (Cole aqui as funções: populateFilters, getFilterValues, filterData, updateKPI, updateBarChart, updateDonutChart, updateLineChart, updateHeatmap da versão anterior) ...
    function populateFilters(data) {
        function populate(selector, values, sort = true) {
            const select = d3.select(selector);
            select.selectAll('option').remove();
            select.append('option').attr('value', 'todos').text('Todos');
            if (sort) values.sort((a, b) => String(a).localeCompare(String(b)));
            values.forEach(val => select.append('option').attr('value', val).text(val));
        }
        populate(selectors.ano, [...new Set(data.map(d => d.Ano))].sort((a, b) => b - a));
        populate(selectors.mes, monthOrder, false);
        populate(selectors.delegacia, [...new Set(data.map(d => d.Delegacia))]);
        populate(selectors.ocorrencia, [...new Set(data.map(d => d.TipoOcorrencia))]);
    }

    function getFilterValues() {
        return {
            ano: d3.select(selectors.ano).property('value'), mes: d3.select(selectors.mes).property('value'),
            delegacia: d3.select(selectors.delegacia).property('value'), ocorrencia: d3.select(selectors.ocorrencia).property('value'),
        };
    }

    function filterData(data, filters) {
        return data.filter(d =>
            (filters.ano === 'todos' || d.Ano == filters.ano) &&
            (filters.mes === 'todos' || d.Mes === filters.mes) &&
            (filters.delegacia === 'todos' || d.Delegacia === filters.delegacia) &&
            (filters.ocorrencia === 'todos' || d.TipoOcorrencia === filters.ocorrencia)
        );
    }
    
    function updateKPI(data) {
        const total = d3.sum(data, d => d.Ocorrencias).toLocaleString('pt-BR');
        d3.select(selectors.kpi).text(`Total de Ocorrências: ${total}`);
    }

    function updateBarChart(data) {
        const svg = d3.select(selectors.barChart);
        svg.selectAll("*").remove();
        const aggregated = d3.rollups(data, v => d3.sum(v, d => d.Ocorrencias), d => d.Delegacia).map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value).slice(0, 15);
        if (aggregated.length === 0) return;
        
        const margin = { top: 20, right: 20, bottom: 170, left: 60 };
        const width = svg.node().clientWidth - margin.left - margin.right;
        const height = svg.node().clientHeight - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const x = d3.scaleBand().range([0, width]).padding(0.2).domain(aggregated.map(d => d.key));
        const y = d3.scaleLinear().range([height, 0]).domain([0, d3.max(aggregated, d => d.value)]);

        g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "translate(-10,10)rotate(-45)").style("text-anchor", "end");
        g.append("g").call(d3.axisLeft(y));
        
        g.selectAll(".bar").data(aggregated).join("rect").attr("class", "bar").attr("fill", "var(--primary-color)").attr("x", d => x(d.key)).attr("y", d => y(d.value)).attr("width", x.bandwidth()).attr("height", d => height - y(d.value)).on("mouseover", (event, d) => tooltip.style("opacity", 1).html(`<b>${d.key}</b><br>Ocorrências: ${d.value.toLocaleString('pt-BR')}`)).on("mousemove", event => tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px")).on("mouseout", () => tooltip.style("opacity", 0));
    }

    function updateDonutChart(data) {
        const svg = d3.select(selectors.donutChart);
        svg.selectAll("*").remove();
        const aggregated = d3.rollups(data, v => d3.sum(v, d => d.Ocorrencias), d => d.TipoOcorrencia).map(([key, value]) => ({ key, value })).sort((a,b) => b.value - a.value).slice(0, 7);
        if (aggregated.length === 0) return;

        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const width = svg.node().clientWidth - margin.left - margin.right;
        const height = svg.node().clientHeight - margin.top - margin.bottom;
        const radius = Math.min(width, height) / 2;

        const g = svg.append("g").attr("transform", `translate(${svg.node().clientWidth / 2}, ${svg.node().clientHeight / 2})`);

        const color = d3.scaleOrdinal(d3.schemeTableau10);
        const pie = d3.pie().value(d => d.value).sort(null);
        const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
        
        g.selectAll("path").data(pie(aggregated)).join("path").attr("d", arc).attr("fill", d => color(d.data.key)).on("mouseover", (event, d) => tooltip.style("opacity", 1).html(`<b>${d.data.key}</b><br>Ocorrências: ${d.data.value.toLocaleString('pt-BR')}`)).on("mousemove", event => tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px")).on("mouseout", () => tooltip.style("opacity", 0));
    }
    
    function updateLineChart(data) {
        const svg = d3.select(selectors.lineChart);
        svg.selectAll("*").remove();
        const dataByYear = d3.group(data, d => d.Ano);
        const margin = { top: 40, right: 20, bottom: 50, left: 60 };
        const width = svg.node().clientWidth - margin.left - margin.right;
        const height = svg.node().clientHeight - margin.top - margin.bottom;
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const x = d3.scalePoint().domain(monthOrder).range([0, width]);
        const yMax = d3.max(data, d => d.Ocorrencias);
        const y = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);
        const color = d3.scaleOrdinal(d3.schemeCategory10);
        g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
        g.append("g").call(d3.axisLeft(y));
        const line = d3.line().x(d => x(d.Mes)).y(d => y(d.Ocorrencias));
        dataByYear.forEach((yearData, year) => {
            const sortedYearData = yearData.sort((a, b) => monthOrder.indexOf(a.Mes) - monthOrder.indexOf(b.Mes));
            g.append("path").datum(sortedYearData).attr("fill", "none").attr("stroke", color(year)).attr("stroke-width", 2.5).attr("d", line);
        });
        const legend = g.append("g").attr("class", "legend").attr("transform", `translate(0, ${height + 40})`);
        let legendXOffset = 0;
        dataByYear.forEach((_, year) => {
            const legendItem = legend.append("g").attr("class", "legend-item").attr("transform", `translate(${legendXOffset}, 0)`);
            legendItem.append("rect").attr("class", "legend-rect").attr("width", 12).attr("height", 12).style("fill", color(year));
            legendItem.append("text").attr("class", "legend-text").attr("x", 18).attr("y", 9).text(year);
            legendXOffset += legendItem.node().getBBox().width + 15;
        });
    }

    function updateHeatmap(data) {
        const svg = d3.select(selectors.heatmap);
        svg.selectAll("*").remove();
        const crimeData = d3.rollups(data, v => d3.sum(v, d => d.Ocorrencias), d => d.TipoOcorrencia);
        const topCrimeTypes = crimeData.sort((a,b) => b[1] - a[1]).slice(0, 10).map(d => d[0]);
        const dataHeatmap = Array.from(d3.rollup(data, v => d3.sum(v, d => d.Ocorrencias), d => d.TipoOcorrencia, d => d.Mes), ([type, monthMap]) => Array.from(monthMap, ([month, value]) => ({ type, month, value }))).flat().filter(d => topCrimeTypes.includes(d.type));
        if (dataHeatmap.length === 0) return;
        const margin = { top: 20, right: 20, bottom: 20, left: 300 };
        const width = svg.node().clientWidth - margin.left - margin.right;
        const height = svg.node().clientHeight - margin.top - margin.bottom;
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const x = d3.scaleBand().domain(monthOrder).range([0, width]).padding(0.05);
        const y = d3.scaleBand().domain(topCrimeTypes).range([height, 0]).padding(0.05);
        const color = d3.scaleSequential(d3.interpolateBlues).domain([0, d3.max(dataHeatmap, d => d.value)]);
        g.append("g").call(d3.axisLeft(y)).select(".domain").remove();
        g.selectAll(".heatmap-axis text").attr("font-size", "11px");
        g.selectAll(".cell").data(dataHeatmap).join("rect").attr("x", d => x(d.month)).attr("y", d => y(d.type)).attr("width", x.bandwidth()).attr("height", y.bandwidth()).style("fill", d => color(d.value)).on("mouseover", (event, d) => { tooltip.style("opacity", 1).html(`<b>${d.type}</b><br>${d.month}: ${d.value.toLocaleString('pt-BR')}`); }).on("mousemove", event => tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px")).on("mouseout", () => tooltip.style("opacity", 0));
    }
    
    // ** FUNÇÃO DO MAPA REVERTIDA PARA A VERSÃO COM PONTOS E ZOOM **
    function updateMap(data, geojson, geoDelegacias) {
        const svg = d3.select(selectors.map);
        svg.selectAll("*").remove();
        if (!geojson) return;

        const margin = { top: 10, right: 10, bottom: 10, left: 10 };
        const width = svg.node().clientWidth;
        const height = svg.node().clientHeight;
        
        const g = svg.append("g");
        const projection = d3.geoMercator().fitSize([width, height], geojson);
        const pathGenerator = d3.geoPath().projection(projection);

        // Desenha o mapa base com cor cinza
        g.selectAll(".district").data(geojson.features).join("path").attr("class", "district").attr("d", pathGenerator);
            
        // Desenha os nomes dos distritos
        g.selectAll(".district-label").data(geojson.features).join("text").attr("class", "district-label").attr("transform", d => `translate(${pathGenerator.centroid(d)})`).text(d => pathGenerator.area(d) > 200 ? d.properties.NOME_DIST : '');

        // Lógica para desenhar os pontos das delegacias
        if (geoDelegacias && geoDelegacias.length > 0) {
            const ocorrByDelegacia = d3.rollup(data, v => d3.sum(v, d => d.Ocorrencias), d => d.Delegacia);
            const maxOcorr = d3.max(Array.from(ocorrByDelegacia.values())) || 1;
            const radiusScale = d3.scaleSqrt().domain([0, maxOcorr]).range([3, 25]);

            const delegaciasToPlot = geoDelegacias.map(geoDP => ({
                ...geoDP,
                ocorrencias: ocorrByDelegacia.get(geoDP.Delegacia) || 0,
                radius: radiusScale(ocorrByDelegacia.get(geoDP.Delegacia) || 0)
            })).filter(d => d.ocorrencias > 0);
            
            g.selectAll(".station-point").data(delegaciasToPlot.sort((a,b) => b.ocorrencias - a.ocorrencias)).join("circle")
                .attr("class", "station-point")
                .attr("transform", d => `translate(${projection([d.Longitude, d.Latitude])})`)
                .attr("r", d => d.radius)
                .attr("fill", "#d90429"); // Cor vermelha para os pontos
        }

        // Lógica de Zoom
        const zoom = d3.zoom().scaleExtent([1, 10]).translateExtent([[0, 0], [width, height]]).on("zoom", event => {
            g.attr("transform", event.transform);
        });

        // Lógica de Tooltip que funciona com Zoom
        svg.call(zoom)
           .on("mousemove", function(event) {
                const [mx, my] = d3.pointer(event);
                const currentTransform = d3.zoomTransform(svg.node());
                
                const delegaciasToPlot = geoDelegacias.map(geoDP => ({...geoDP, ocorrencias: (d3.rollup(data, v => d3.sum(v, d => d.Ocorrencias), d => d.Delegacia)).get(geoDP.Delegacia) || 0 }));

                const closestPoint = d3.least(delegaciasToPlot, d => {
                    const [px, py] = projection([d.Longitude, d.Latitude]);
                    const [tx, ty] = currentTransform.apply([px, py]);
                    const dx = mx - tx;
                    const dy = my - ty;
                    return dx * dx + dy * dy;
                });

                if (closestPoint) {
                    const [px, py] = projection([closestPoint.Longitude, closestPoint.Latitude]);
                    const [tx, ty] = currentTransform.apply([px, py]);
                    const distance = Math.hypot(mx - tx, my - ty);
                    
                    const maxOcorr = d3.max(delegaciasToPlot, d => d.ocorrencias) || 1;
                    const radiusScale = d3.scaleSqrt().domain([0, maxOcorr]).range([3, 25]);
                    const radius = radiusScale(closestPoint.ocorrencias);
                    const threshold = radius * currentTransform.k;

                    if (distance < threshold) {
                        tooltip.style("opacity", 1)
                               .html(`<b>${closestPoint.Delegacia}</b><br>Ocorrências: ${closestPoint.ocorrencias.toLocaleString('pt-BR')}`)
                               .style("left", (event.pageX + 15) + "px")
                               .style("top", (event.pageY - 28) + "px");
                    } else {
                        tooltip.style("opacity", 0);
                    }
                }
           })
           .on("mouseout", function() {
                tooltip.style("opacity", 0);
           });
    }
});
