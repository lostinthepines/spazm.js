# spazm.js

A no-nonsense spin, pan, and zoom web viewer for 3D models built as a jQuery plugin

## Installation

The script should usually be included after the jQuery library:
	
	<script type="text/javascript" src="/path/to/jquery.spazm.js"></script>

Dependencies are limited to the [mousewheel](https://github.com/brandonaaron/jquery-mousewheel/) and [imagesloaded](https://github.com/desandro/imagesloaded/) plugins:

	<script type="text/javascript" src="/path/to/jquery.mousewheel.min.js"></script>
	<script type="text/javascript" src="/path/to/jquery.imagesloaded.min.js"></script>

## Usage

Initiate a spazm.js viewer on an empty div with default options

	$('#spazm_viewer').spazm();

Alternatively, initiate a spazm.js viewer and pass in options

	$('#spazm_viewer').spazm({
		'prefix':'images/spazm_images/',
		'zoom_level':1,
		'num_images':36
	});

## Options

	'prefix':'images/spazm_images/'

Set the path to the images to be used with the viewer

	'num_images':36

Tell spazm.js how many images are in your sequence

	'zoom_level':0

Set the initial zoom level, 0 is fully zoomed out

	'num_zoom_levels':2

Tell spazm.js how many zoom levels are available

	'angle_index':0

Set the initial angle of the viewer

	'rotate_right':false

Flip the direction of rotation, if desired

## Development

- Hosted at [GitHub](https://github.com/bearhanded/spazm.js)
- Please report problems, questions, and feature requests on [GitHub Issues](https://github.com/bearhanded/spazm.js/issues)

## Authors

- [Nathan Bailey](https://github.com/ntdb)
- [Chris Barnes](https://github.com/barnesy)
- Alex Peterson