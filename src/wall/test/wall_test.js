import {Wall} from '../index';

describe('wall', () => {
  describe('constructor', () => {
    it('isOpenOnPositiveSide', () => {
      const params = {
        x: 4,
        y: null,
        z: null,
        isOpenOnPositiveSide: true,
        thickness: 10,
        halfSideLength: 10,
      };
      const wall = new Wall(params);
      expect(wall.minX).toEqual(-6);
      expect(wall.minY).toEqual(-10);
      expect(wall.minZ).toEqual(-10);
      expect(wall.maxX).toEqual(4);
      expect(wall.maxY).toEqual(10);
      expect(wall.maxZ).toEqual(10);
    });

    it('!isOpenOnPositiveSide', () => {
      const params = {
        x: 4,
        y: null,
        z: null,
        isOpenOnPositiveSide: false,
        thickness: 10,
        halfSideLength: 10,
      };
      const wall = new Wall(params);
      expect(wall.minX).toEqual(4);
      expect(wall.minY).toEqual(-10);
      expect(wall.minZ).toEqual(-10);
      expect(wall.maxX).toEqual(14);
      expect(wall.maxY).toEqual(10);
      expect(wall.maxZ).toEqual(10);
    });

    it('x-z plane', () => {
      const params = {
        x: null,
        y: 4,
        z: null,
        isOpenOnPositiveSide: true,
        thickness: 10,
        halfSideLength: 10,
      };
      const wall = new Wall(params);
      expect(wall.minX).toEqual(-10);
      expect(wall.minY).toEqual(-6);
      expect(wall.minZ).toEqual(-10);
      expect(wall.maxX).toEqual(10);
      expect(wall.maxY).toEqual(4);
      expect(wall.maxZ).toEqual(10);
    });

    it('x-y plane', () => {
      const params = {
        x: null,
        y: null,
        z: 4,
        isOpenOnPositiveSide: true,
        thickness: 10,
        halfSideLength: 10,
      };
      const wall = new Wall(params);
      expect(wall.minX).toEqual(-10);
      expect(wall.minY).toEqual(-10);
      expect(wall.minZ).toEqual(-6);
      expect(wall.maxX).toEqual(10);
      expect(wall.maxY).toEqual(10);
      expect(wall.maxZ).toEqual(4);
    });
  });

  it('scale', () => {
    const params = {
      x: 4,
      y: null,
      z: null,
      isOpenOnPositiveSide: true,
      thickness: 10,
      halfSideLength: 10,
    };
    const wall = new Wall(params);
    expect(wall.scale).toEqual(vec3.fromValues(10, 20, 20));
  });
});
