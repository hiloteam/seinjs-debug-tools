/**
 * @File   : CannonDebugRenderer.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 10/24/2018, 10:34:47 PM
 * @Description:
 */
import * as Sein from 'seinjs';

/**
 * 用于调试基于CANNON的物理世界的类，可视化包围盒。
 */
export default class CannonDebugRenderer {
  private _game: Sein.Game;
  private _world: any;
  private _actors: Sein.StaticMeshActor[] = [];
  private _material: Sein.BasicMaterial = new Sein.BasicMaterial({
    diffuse: new Sein.Color(0, 1, 0, 1),
    lightType: 'NONE'
  });
  private _tmpVec0: any;
  private _tmpVec1: any;
  private _tmpVec2: any;
  private _tmpQuat0: any;
  private _sphereGeometry = new Sein.SphereGeometry({radius: 1});
  private _boxGeometry = new Sein.BoxGeometry({width: 1, height: 1, depth: 1});
  private _planeGeometry = new Sein.PlaneGeometry({width: 10, height: 10});

  constructor(game: Sein.Game) {
    this._game = game;
    this._world = (this._game.world.physicWorld as any)._world;
    const CANNON = (this._game.world.physicWorld as any).CANNON;

    this._tmpVec0 = new CANNON.Vec3();
    this._tmpVec1 = new CANNON.Vec3();
    this._tmpVec2 = new CANNON.Vec3();
    this._tmpQuat0 = new CANNON.Quaternion();

    // const b = game.world.addActor(Sein.BSPBuilder.createBox('a', {}, this._material));
  }

  /**
   * 在实例化调试器类后，请在每一帧手动调用此`update`方法保证同步。
   */
  public update() {
    // debugger
    const bodies = this._world.bodies;
    const actors = this._actors;
    const shapeWorldPosition = this._tmpVec0;
    const shapeWorldQuaternion = this._tmpQuat0;

    let actorIndex = 0;

    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i];

      for (let j = 0; j < body.shapes.length; j += 1) {
        const shape = body.shapes[j];

        this.updateActor(actorIndex, shape);

        const actor = actors[actorIndex];

        if (actor) {
          // Get world position
          body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition);
          body.position.vadd(shapeWorldPosition, shapeWorldPosition);

          // Get world quaternion
          body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion);

          // Copy to actors
          actor.transform.position.set(shapeWorldPosition.x, shapeWorldPosition.y, shapeWorldPosition.z);
          actor.transform.quaternion.set(shapeWorldQuaternion.x, shapeWorldQuaternion.y, shapeWorldQuaternion.z, shapeWorldQuaternion.w);
        }

        actorIndex += 1;
      }
    }

    for (let i = actorIndex; i < actors.length; i += 1) {
      const actor = actors[i];
      if (actor) {
        actor.removeFromParent();
      }
    }

    actors.length = actorIndex;
  }

  private updateActor(index: number, shape) {
    let actor = this._actors[index];

    if (!this.typeMatch(actor, shape)) {
      if (actor) {
        this._game.world.removeActor(actor);
      }

      actor = this._actors[index] = this.createActor(shape);
    }

    this.scaleActor(actor, shape);
  }

  private typeMatch(actor: Sein.StaticMeshActor, shape) {
    const CANNON = (this._game.world.physicWorld as any).CANNON;

    if (!actor) {
      return false;
    }
    const geo = actor.root.geometry;

    return (
      (geo instanceof Sein.SphereGeometry && shape instanceof CANNON.Sphere) ||
      (geo instanceof Sein.BoxGeometry && shape instanceof CANNON.Box) ||
      (geo instanceof Sein.PlaneGeometry && shape instanceof CANNON.Plane) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.ConvexPolyhedron) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.Triactor) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.Heightfield)
    );
  }

  private createActor(shape) {
    const {world} = this._game;
    const CANNON = (world.physicWorld as any).CANNON;

    let actor;
    const material = this._material;

    switch (shape.type) {
      case CANNON.Shape.types.SPHERE:
        actor = world.addActor('shpereCollider', Sein.StaticMeshActor, {geometry: this._sphereGeometry, material});
        break;
      case CANNON.Shape.types.BOX:
        actor = world.addActor('boxCollider', Sein.StaticMeshActor, {geometry: this._boxGeometry, material});
        break;
      case CANNON.Shape.types.PLANE:
        actor = world.addActor('planeCollider', Sein.StaticMeshActor, {geometry: this._planeGeometry, material});
        break;
      case CANNON.Shape.types.Cylinder:
        actor = world.addActor('cylinderCollider', Sein.StaticMeshActor, {geometry: new Sein.CylinderGeometry({}), material});
        break;
      // case CANNON.Shape.types.CONVEXPOLYHEDRON:
      //   const geo = new Sein.Geometry();

      //   for (let i = 0; i < shape.vertices.length; i += 1) {
      //     const v = shape.vertices[i];
      //     geo.vertices.data.push(new Sein.Vector3(v.x, v.y, v.z));
      //   }

      //   for (let i = 0; i < shape.faces.length; i += 1) {
      //     const face = shape.faces[i];
      //     // add triangles
      //     const a = face[0];
      //     for (let j = 1; j < face.length - 1; j += 1) {
      //       const b = face[j];
      //       const c = face[j + 1];
      //       geo.indices.data.push(a, b, c);
      //     }
      //   }
      //   actor = new Sein.StaticMeshActor('convex', {geometry: geo, material});
      //   shape.geometryId = geo.id;
      //   break;
      // case CANNON.Shape.types.TRIMESH:
      //   const geometry = new THREE.Geometry();
      //   const v0 = this.tmpVec0;
      //   const v1 = this.tmpVec1;
      //   const v2 = this.tmpVec2;
      //   for (let i = 0; i < shape.indices.length / 3; i += 1) {
      //     shape.getTriangleVertices(i, v0, v1, v2);
      //     geometry.vertices.push(
      //       new Sein.Vector3(v0.x, v0.y, v0.z),
      //       new Sein.Vector3(v1.x, v1.y, v1.z),
      //       new Sein.Vector3(v2.x, v2.y, v2.z)
      //     );
      //     const j = geometry.vertices.length - 3;
      //     geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
      //   }
      //   geometry.computeBoundingSphere();
      //   geometry.computeFaceNormals();
      //   actor = new Sein.StaticMeshActor('trimesh', {geometry, material});
      //   shape.geometryId = geometry.id;
      //   break;
      // case CANNON.Shape.types.HEIGHTFIELD:
      //   const geometry = new Sein.Geometry();
      //   const v0 = this._tmpVec0;
      //   const v1 = this._tmpVec1;
      //   const v2 = this._tmpVec2;
      //   for (let xi = 0; xi < shape.data.length - 1; xi += 1) {
      //     for (let yi = 0; yi < shape.data[xi].length - 1; yi += 1) {
      //       for (let k = 0; k < 2; k += 1) {
      //         shape.getConvexTrianglePillar(xi, yi, k === 0);
      //         v0.copy(shape.pillarConvex.vertices[0]);
      //         v1.copy(shape.pillarConvex.vertices[1]);
      //         v2.copy(shape.pillarConvex.vertices[2]);
      //         v0.vadd(shape.pillarOffset, v0);
      //         v1.vadd(shape.pillarOffset, v1);
      //         v2.vadd(shape.pillarOffset, v2);
      //         geometry.vertices.data.push(
      //           new Sein.Vector3(v0.x, v0.y, v0.z),
      //           new Sein.Vector3(v1.x, v1.y, v1.z),
      //           new Sein.Vector3(v2.x, v2.y, v2.z)
      //         );
      //         const i = geometry.vertices.length - 3;
      //         geometry.indices.data.push(i, i + 1, i + 2);
      //       }
      //     }
      //   }

      //   actor = new Sein.StaticMeshActor('heightFiled', {geometry, material});
      //   shape.geometryId = geometry.id;
      //   break;
      default:
        break;
    }

    return actor;
  }

  private scaleActor(actor: Sein.SceneActor, shape) {
    const CANNON = (this._game.world.physicWorld as any).CANNON;

    switch (shape.type) {

      case CANNON.Shape.types.SPHERE:
        const radius = shape.radius;
        actor.transform.scale.set(radius, radius, radius);
        break;

      case CANNON.Shape.types.BOX:
        actor.transform.scale.x = shape.halfExtents.x * 2;
        actor.transform.scale.y = shape.halfExtents.y * 2;
        actor.transform.scale.z = shape.halfExtents.z * 2;
        break;

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
        actor.transform.scale.set(1, 1, 1);
        break;

      case CANNON.Shape.types.TRIMESH:
        actor.transform.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);
        break;
      case CANNON.Shape.types.HEIGHTFIELD:
        actor.transform.scale.set(1, 1, 1);
        break;
      default:
        break;
    }
  }
}
