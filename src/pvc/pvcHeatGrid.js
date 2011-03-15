/**
 * HeatGridChart is the main class for generating... heatGrid charts.
 *  A heatGrid visualizes a matrix of values by a grid (matrix) of *
 *  bars, where the color of the bar represents the actual value.
 *  By default the colors are a range of green values, where
 *  light green represents low values and dark green high values.
 *  A heatGrid contains:
 *     - two categorical axis (both on x and y-axis)
 *     - no legend as series become rows on the perpendicular axis 
 */

pvc.HeatGridChart = pvc.CategoricalAbstract.extend({

    heatGridChartPanel : null,

    constructor: function(o){


        this.base(o);

        var _defaults = {
            showValues: true,
            stacked: false,
            panelSizeRatio: 0.9,
            heatGridSizeRatio: 0.9,
            maxHeatGridSize: 2000,
            originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
             // use a categorical here based on series labels
            perpAxisOrdinal: true 
        };


        // Apply options
        $.extend(this.options,_defaults, o);


    },

    preRender: function(){

        this.base();

        pvc.log("Prerendering in heatGridChart");


        this.heatGridChartPanel = new pvc.HeatGridChartPanel(this, {
            stacked: this.options.stacked,
            panelSizeRatio: this.options.panelSizeRatio,
            heatGridSizeRatio: this.options.heatGridSizeRatio,
            maxHeatGridSize: this.options.maxHeatGridSize,
            showValues: this.options.showValues,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation
        });

        this.heatGridChartPanel.appendTo(this.basePanel); // Add it

    }

}
);


/*
 * HeatGrid chart panel. Generates a heatGrid chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide heatGrid value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>heatGridSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by heatGrids. Default: 0.5 (50%)
 * <i>maxHeatGridSize</i> - Maximum size of a heatGrid in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>heatGrid_</i> - for the actual heatGrid
 * <i>heatGridPanel_</i> - for the panel where the heatGrids sit
 * <i>heatGridLabel_</i> - for the main heatGrid label
 */


pvc.HeatGridChartPanel = pvc.BasePanel.extend({

    _parent: null,
    pvHeatGrid: null,
    pvHeatGridLabel: null,
    pvCategoryPanel: null,
    pvSecondLie: null,
    pvSecondDot: null,
    data: null,

    stacked: false,
    panelSizeRatio: 1,
    heatGridSizeRatio: 0.5,
    showTooltips: true,
    maxHeatGridSize: 200,
    showValues: true,
    orientation: "vertical",


    constructor: function(chart, options){

        this.base(chart,options);

    },

    create: function(){

      var myself = this;
      this.width = this._parent.width;
      this.height = this._parent.height;

      this.pvPanel = this._parent.getPvPanel().add(this.type)
           .width(this.width)
           .height(this.height)

      var anchor = this.orientation == "vertical"?"bottom":"left";

        // reuse the existings scales
      var xScale = this.chart.xAxisPanel.scale;
      var yScale = this.chart.yAxisPanel.scale;
        
      var data = this.chart.dataEngine.getValues();

      cols =xScale.pb_categories;
      data = data.map(function(d) pv.dict(cols, function() d[this.index]));

      /* The color scale ranges 3 standard deviations in each direction. */
      // compute the mean and standard-deviation for each column
      var mean = pv.dict(cols, function(f) pv.mean(data, function(d) d[f]));
      var sd = pv.dict(cols, function(f) pv.deviation(data, function(d) d[f]));
      //  compute a scale-function for each column (each key)
      var fill = pv.dict(cols, function(f) pv.Scale.linear()
        .domain(-2 * sd[f] + mean[f], 2 * sd[f] + mean[f])
        .range("white", "darkgreen"));

      /* The cell dimensions. */
      var w = (xScale.max - xScale.min)/xScale.pb_categories.length;
      var h = (yScale.max - yScale.min)/yScale.pb_categories.length;

      if (anchor != "bottom") { var tmp = w; w = h; h = tmp; }

/** original function   (for "vertical chart only")
      this.pvPanel.add(pv.Panel)
        .data(cols)
        .left(function() this.index * w)
        .width(w)
        .add(pv.Panel)
        .data(data)
        .top(function() this.index * h)
        .height(h)
        .fillStyle(function(d, f) fill[f](d[f]))
        .strokeStyle("white")
        .lineWidth(1)
        .antialias(false);
        ***/

      this.pvPanel.add(pv.Panel)
        .data(cols)
        [pvc.BasePanel.relativeAnchor[anchor]](function() this.index * w)
        [pvc.BasePanel.paralelLength[anchor]](w)
        .add(pv.Panel)
        .data(data)
        [pvc.BasePanel.oppositeAnchor[anchor]](function() this.index * h)
        [pvc.BasePanel.orthogonalLength[anchor]](h)
        .fillStyle(function(d, f) fill[f](d[f]))
        .strokeStyle("white")
        .lineWidth(1)
        .antialias(false);


        // NO SUPPORT for overflow and underflow on HeatGrids

        // NO SUPPORT for SecondAxis on HeatGrids

        // Labels:



/*************   useful other options (clickable etc...)
        if(this.showTooltips){
            this.pvHeatGrid
            .event("mouseover", pv.Behavior.tipsy({
                gravity: "s",
                fade: true
            }));
        }


        if (this.chart.options.clickable){
            this.pvHeatGrid
            .cursor("pointer")
            .event("click",function(d){
                var s = myself.chart.dataEngine.getSeries()[myself.stacked?this.parent.index:this.index]
                var c = myself.chart.dataEngine.getCategories()[myself.stacked?this.index:this.parent.index]
                return myself.chart.options.clickAction(s,c, d);
            });
        }

        if(this.showValues){
            this.pvHeatGridLabel = this.pvHeatGrid
            .anchor("center")
            .add(pv.Label)
            .bottom(0)
            .text(pv.identity)

            // Extend heatGridLabel
            this.extend(this.pvHeatGridLabel,"heatGridLabel_");
        }
        ********/

        // Extend heatGrid and heatGridPanel
        this.extend(this.pvHeatGrid,"heatGridPanel_");
        this.extend(this.pvHeatGrid,"heatGrid_");

        // Extend body
        this.extend(this.pvPanel,"chart_");

    }

});
