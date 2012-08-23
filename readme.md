# spazm.js

A no-nonsense spin, pan, and zoom web viewer for 3D models built as a jQuery plugin

## Installation

The script should usually be included after the jQuery library:
	
	<script type="text/javascript" src="/path/to/jquery.spazm.js"></script>

Dependencies are limited to the [mousewheel](https://github.com/brandonaaron/jquery-mousewheel/) and [imagesloaded](https://github.com/desandro/imagesloaded/) plugins:

	<script type="text/javascript" src="/path/to/jquery.mousewheel.min.js"></script>
	<script type="text/javascript" src="/path/to/jquery.imagesloaded.min.js"></script>

## Usage

Because the plugin is strictly client-side it relies on a specific naming scheme for the images: 'angle_zoomlevel_x_y.format'. If you are only using the spinning functionality of spazm.js then you may name your images numerically by 'angle' (0_0_0_0.jpg, 1_0_0_0.jpg, and so forth). If not and this seems like a real pain then the [spazm.js app](http://www.spazmjs.com/app) can help.

	0_0_0_0.jpg (the first angle, completely zoomed out, at the upper left hand corner)
	5_1_0_2.jpg (the fifth angle, zoomed in one level, panned down 2 tile lengths)

Create an empty DIV element to contain your viewer and set its width and height.

	<div id='spazm_viewer' css='width:500; height:500'></div>

Initiate a spazm.js viewer on your div with only the required parameters

	$('#spazm_viewer').spazm({
		'prefix':'images/spazm_images/',
		'num_images':36,
	  'full_width' : 5000,
	  'full_height' : 3750,
	  'num_zoom_levels' : 2
	});

Alternatively, initiate a spazm.js viewer and pass in extra options

	$('#spazm_viewer').spazm({
		'prefix':'images/spazm_images/',
		'num_images':36,
	  'full_width' : 5000,
	  'full_height' : 3750,
	  'zoom_level' : 1,
	  'angle_index' : 90,
	  'rotate_right' : false,
	  'format' : 'png'
	});

## Options (* denotes required parameters)

	'prefix':'images/spazm_images/'

* The path to the images to be used with the viewer

	'num_images':36

* Tell spazm.js how many images are in your sequence

	'full_width':5000

* Tell spazm.js the full (source) width of your images

	'full_height':3750

* Tell spazm.js the full (source) height of your images

	'num_zoom_levels':2

* Tell spazm.js how many zoom levels are available (set to 0 for spin only)

	'zoom_level':0

Set the initial zoom level, 0 is fully zoomed out

	'angle_index':0

Set the initial angle of the viewer

	'rotate_right':false

Flip the direction of rotation, if desired

	'format':'png'

Set your selected image file format if not 'jpg'

## Development

- Hosted at [GitHub](https://github.com/bearhanded/spazm.js)
- Please report problems, questions, and feature requests on [GitHub Issues](https://github.com/bearhanded/spazm.js/issues)

## Authors

- [Nathan Bailey](https://github.com/ntdb)
- [Chris Barnes](https://github.com/barnesy)
- Alex Peterson