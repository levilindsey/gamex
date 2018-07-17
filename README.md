# gamex

#### A 3D WebGL-based game engine.

_See this in use at [levi.codes/dynamics-example][demo]!_

This project includes a 3D WebGL-based [graphics framework][grafx], and 3D [physics engine][physx], 
and miscellaneous other features that are commonly needed when creating a game.

TODO: Add some sort of getting set up and understanding the code docs.

## Notable Features

TODO
- A general system for interacting with the dat.GUI library for dynamically adjusting system
  parameters.
- A ton of cool features in supporting libraries--notably:
  - [grafx][grafx]: A 3D graphics framework for WebGL.
  - [physx][physx]: A physics engine with 3D rigid-body dynamics and collision detection (with
    impulse-based resolution).

## Acknowledgements / Technology Stack

The technologies used in this library include:

- [ES2015][es2015]
- [WebGL][webgl]
- [gulp.js][gulp]
- [Babel][babel]
- [Browserify][browserify]
- [SASS][sass]
- [physx][physx]
- [grafx][grafx]
- [lsl-gulp-tasks][lsl-gulp-tasks]
- Numerous other packages that are available via [NPM][npm] (these are listed within the
  [`package.json`](./package.json) file)

## License

MIT

[demo]: http://levi.codes/dynamics-example

[grafx]: https://github.com/levilindsey/grafx
[physx]: https://github.com/levilindsey/physx
[animatex]: https://github.com/levilindsey/animatex

[es2015]: http://www.ecma-international.org/ecma-262/6.0/
[webgl]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
[node]: http://nodejs.org/
[babel]: https://babeljs.io/
[browserify]: http://browserify.org/
[gulp]: http://gulpjs.com/
[sass]: http://sass-lang.com/
[jasmine]: http://jasmine.github.io/
[karma]: https://karma-runner.github.io/1.0/index.html
[lsl-gulp-tasks]: https://github.com/levilindsey/lsl-gulp-tasks
[npm]: http://npmjs.org/
