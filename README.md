# gamex

#### A 3D WebGL-based game engine.

_DISCLAIMER: This has some rough edges and should probably not be used directly within production apps._

_See this in use at [levi.codes/dynamics][demo]!_

This project includes a 3D WebGL-based [graphics framework][grafx], a 3D [physics engine][physx],
and miscellaneous other features that are commonly needed when creating a game.

## Notable Features

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
- Numerous other packages that are available via [NPM][npm] (these are listed within the
  [`package.json`](./package.json) file)

## Developing / Running the Code

See [Getting Set Up](./docs/getting-set-up) or [Understanding the
Code](./docs/understanding-the-code) for more info.

## License

MIT

[demo]: http://levi.codes/dynamics

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
[npm]: http://npmjs.org/
