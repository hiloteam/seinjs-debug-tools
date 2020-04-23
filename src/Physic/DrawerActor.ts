/**
 * @File   : Drawer.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 12/14/2018, 8:56:15 PM
 * @Description:
 */
import * as Sein from 'seinjs';

/**
 * 用于快速绘制一些基本几何体，用于调试。
 */
export default class Drawer extends Sein.InfoActor {
  /**
   * 绘制一条线。
   * 
   * @param from 起点。
   * @param to 终点。
   * @param color 颜色。
   * @param lifeTime 自动销毁时长，若不存在则永生。
   */
  public drawLine(
    from: Sein.Vector3,
    to: Sein.Vector3,
    color: Sein.Color = new Sein.Color(1, 1, 1, 1),
    lifeTime: number = 0
  ): Sein.StaticMeshActor {
    const world = this.getWorld();

    const vertices = new Sein.GeometryData(
      new Float32Array([
        from.x, from.y, from.z,
        to.x, to.y, to.z
      ]),
      3,
      null
    );

    const material = new Sein.BasicMaterial({
      lightType: 'NONE',
      diffuse: color
    });

    const geometry = new Sein.Geometry({
      vertices,
      mode: Sein.Constants.LINES
    });

    const actor = world.addActor('line', Sein.StaticMeshActor, {geometry, material});

    if (lifeTime) {
      setTimeout(
        () => world.removeActor(actor),
        lifeTime
      );
    }

    return actor;
  }

  /**
   * 绘制一条长方体体。
   * 
   * @param from 起点。
   * @param to 终点。
   * @param size 横截面长宽。
   * @param color 颜色。
   * @param lifeTime 自动销毁时长，若不存在则永生。
   */
  public drawStrip(
    from: Sein.Vector3,
    to: Sein.Vector3,
    size: number = 1,
    color: Sein.Color = new Sein.Color(1, 1, 1, 1),
    lifeTime: number = 0
  ): Sein.StaticMeshActor {
    const world = this.getWorld();

    const material = new Sein.BasicMaterial({
      lightType: 'NONE',
      diffuse: color
    });

    const ray = to.clone().sub(from);
    const depth = ray.length();
    const actor = world.addActor('line', Sein.BSPBoxActor, {
      width: size, height: size, depth, material, position: from
    });
    actor.transform.lookAt(to);

    if (lifeTime) {
      setTimeout(
        () => world.removeActor(actor),
        lifeTime
      );
    }

    return actor;
  }
}
