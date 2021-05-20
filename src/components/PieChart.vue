<template>
    <div class="flat-shadow" id="pie-chart">
        <h3>Pie Chart</h3>
        <svg class="svg-demo"  viewBox="0 0 930 80">
    <text class="svg-demo__text" x="20" y="35">
    </div>
</template>

<script>
import * as d3 from "d3"
export default {
    name: "PieChart",
props: {},
  data: () => ({
    title: 'Pie Chart'
  }),
     mounted() {
function myFunction() {
	var width =630
	var  height = 450
	var  margin = 70
	var  datax= {"Grade not sufficent": 34, "Withdraw": 29, "Transfer":18, "UA":19};
	 var dis=2
	 var hg=450;

	var val=Object.values(datax);
	var key=Object.keys(datax);
	var data={};
	for (i=0;i<val.length;i++){
	data[key[i]+'('+val[i]+'%)']=val[i];
	};
		// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
	var radius = Math.min(width, height) / 2 - margin

	// append the svg object to the div called 'my_dataviz'
	var svg = d3.select("#pie-chart")
	  .append("svg")
	    .attr("width", width)
	    .attr("height", hg)
	  .append("g")
	    .attr("transform", "translate(" + width / dis + "," + height / 2 + ")");

	// Create dummy data
	//var data = {"Grade not sufficent": 34, "Withdraw": 29, 
	//"Transfer":18, "UA":19}
	//console.log(data);
	// set the color scale
	var color = d3.scaleOrdinal()
	  .domain(Object.keys(data))
	  .range(d3.schemeDark2);

	// Compute the position of each group on the pie:
	var pie = d3.pie()
	  .sort(null) // Do not sort group by size
	.value(function(d) {return d.value; })
	




    
	var data_ready = pie(d3.entries(data))

	// The arc generator
	var arc = d3.arc()
	  .innerRadius(radius * 0.5)         // This is the size of the donut hole
	.outerRadius(radius * 0.8)
	
	
    

	// Another arc that won't be drawn. Just for labels positioning
	var outerArc = d3.arc()
	  .innerRadius(radius * 0.8)
	  .outerRadius(radius * 0.8)


	


	// Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
	svg
	  .selectAll('allSlices')
	  .data(data_ready)
	  .enter()
	  .append('path')
	  .attr('d', arc)
	  .attr('fill', function(d){ return(color(d.data.key)) })
	  .attr("stroke", "white")
	  .style("stroke-width", "2px")
	.style("opacity", 0.7)
    ;
    //.on("click", function(d){location.replace("");});//{location.replace(d.letter+".html");});
	// Add the polylines between chart and labels:
	svg
	  .selectAll('allPolylines')
	  .data(data_ready)
	  .enter()
	  .append('polyline')
		.attr("stroke", "black")
	    .style("fill", "none")
      .attr("stroke-width", 1)
	    .attr('points', function(d) {
	      var posA = arc.centroid(d) // line insertion in the slice
	      var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
	      var posC = outerArc.centroid(d); // Label position = almost the same as posB
	      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
	      posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
	      return [posA, posB, posC]
	    });
	// Add the polylines between chart and labels:
	svg
	  .selectAll('allLabels')
	  .data(data_ready)
	  .enter()
	  .append('text')
	    .text( function(d) { console.log(d.data.key) ; return d.data.key } )
	    .attr('transform', function(d) {
	        var pos = outerArc.centroid(d);
	        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
	        pos[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1);
	        return 'translate(' + pos + ')';
		})
	    .style('text-anchor', function(d) {
	        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
	        return (midangle < Math.PI ? 'start' : 'end')
	  });
	
	svg.selectAll('path')
   		.on('click', (d, i, n) => {
      			console.log(d, i, n)
   })

}
    myFunction();

    }
}
</script>


<style scoped>

</style>