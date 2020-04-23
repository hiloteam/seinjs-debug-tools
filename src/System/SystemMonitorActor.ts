/**
 * @File   : SystemMonitorActor.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 4/28/2019, 10:58:48 AM
 * @Description:
 */
import * as Sein from 'seinjs';

/**
 * 系统信息类型接口。
 */
export interface ISystemMonitorInfo {
  engine: {
    tickerRunning: boolean;
    fps: number;
    gamesCount: number;
    runningGamesCount: number;
  };
  game: {
    name: string;
    paused: boolean;
    actorsCount: number;
    actors: Sein.SArray<Sein.InfoActor>;
  };
  camera: {
    refer: Sein.CameraComponent;
    name: string;
    ownerName: string;
    alive: boolean;
  }[];
  world: {
    name: string;
  };
  level: {
    name: string;
    alive: boolean;
    actorsCount: number;
    actors: Sein.SArray<Sein.ISceneActor>;
  };
  render: Sein.IGameOptions;
  physic: {
    active: boolean;
    alive: boolean;
  };
}

/**
 * `SystemMonitorActor`的初始化参数类型接口。
 */
export interface ISystemMonitorActorOptions {
  /**
   * 更新率，一秒更新几次。
   * 
   * @default 10
   */
  updateRate?: number;
  /**
   * 是否使用可视化的DOM状态显示器，以及要作为DOM父级的容器Div。
   * **注意这只是一个很简陋的实现，有具体需求可以自行实现，或期待以后的Inspector。**
   */
  useDomViewer?: HTMLDivElement;
}

/**
 * 系统状态监控器。可以用于方便得获取一些引擎全局的调试信息。
 */
export default class SystemMonitorActor extends Sein.InfoActor<ISystemMonitorActorOptions> {
  protected _info: ISystemMonitorInfo = {
    engine: null,
    game: null,
    camera: null,
    world: null,
    level: null,
    render: null,
    physic: null
  };

  protected _levelAlive: boolean = false;
  protected _physicAlive: boolean = false;
  protected _actor: Sein.SceneActor = null;
  protected _container: HTMLDivElement;
  protected _infoDiv: HTMLDivElement;
  protected _updateRate: number = 10;
  protected _delta: number = 0;

  /**
   * 当前的状态信息。
   */
  get info() {
    return this._info;
  }

  /**
   * 事件管理器，有一个`Update`事件用于在更新是通知。
   */
  get event(): Sein.EventManager<{Update: {info: ISystemMonitorInfo}}> {
    return this._root.event as Sein.EventManager<{Update: {info: ISystemMonitorInfo}}>;
  }

  /**
   * 初始化，继承请先`super.onInit()`。
   */
  public onInit(initState: ISystemMonitorActorOptions) {
    this.event.register('Update');

    if (initState && initState.useDomViewer) {
      this._container = initState.useDomViewer;
      this._infoDiv = document.createElement('div');
      this._infoDiv.className = 'sein-system-monitor';
      this.generateCSS();
      this._container.appendChild(this._infoDiv);
    }

    if (initState && initState.updateRate) {
      this._updateRate = initState.updateRate;
    }
  }

  /**
   * 加入Game，继承请先`super.onAdd()`。
   */
  public onAdd() {
    const game = this.getGame();

    game.event.add('LevelDidInit', this.generateActor);
    game.event.add('WorldWillDestroy', this.clearActor);

    if (game.level) {
      this.generateActor();
    }

    this.sync(0);
  }

  private generateActor = () => {
    if (this._actor) {
      return;
    }

    const actor = this._actor = this.getWorld().addActor('forMonitor', Sein.SceneActor);

    actor.persistent = true;
    actor.onUpdate = () => {
      this._levelAlive = true;
    };

    if (this.getPhysicWorld()) {
      const rigidBody = actor.addComponent('rigidBody', Sein.RigidBodyComponent, {mass: 0, sleeping: true});

      rigidBody.onUpdate = () => {
        this._physicAlive = true;
      };
    }
  }

  private clearActor = () => {
    this._actor = null;
  }

  /**
   * 每一帧更新，继承请先`super.onUpdate()`。
   */
  public onUpdate(delta: number) {
    this._delta += delta;

    if (this._delta >= 1000 / this._updateRate) {
      this._delta = 0;
      this.sync(delta);
    }
  }

  protected sync(delta: number) {
    const game = this.getGame();
    const engine = game.parent as any;
    const world = this.getWorld();
    const level = this.getLevel();
    const physicWorld = this.getPhysicWorld();

    this._info = {
      engine: {
        tickerRunning: !game.ticker.paused,
        fps: 1000 / delta,
        gamesCount: engine._games.length,
        runningGamesCount: engine._runningGames.length
      },
      game: {
        name: game.name.value,
        paused: engine._runningGames.indexOf(game) < 0,
        actorsCount: game.actors.length,
        actors: game.actors
      },
      camera: world.mainCamera ? [
        {
          refer: world.mainCamera,
          name: world.mainCamera.name.value,
          ownerName: world.mainCamera.getOwner().name.value,
          alive: world.mainCamera.rendererAlive
        }
      ] : [],
      world: {
        name: world.name.value
      },
      level: {
        name: level.name.value,
        alive: this._levelAlive,
        actorsCount: level.actors.length,
        actors: level.actors
      },
      render: game.renderer as any,
      physic: {
        active: !!physicWorld,
        alive: this._physicAlive
      }
    };

    this.generateDom();

    this.event.trigger('Update', this.info);
  }

  protected generateCSS() {
    const styleElement = document.createElement('style');
    styleElement.innerText = `
.sein-system-monitor {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  background: rgba(255, 0, 0, .6);
  padding: 4px 12px;
}

.sein-system-monitor-block {
  margin-bottom: 12px;
}

.sein-system-monitor-block h2 {
  font-size: 15px;
  margin-bottom: 4px;
}

.sein-system-monitor-block ul {
  font-size: 14px;
}

.sein-system-monitor-block ul li {

}
    `;

    document.head.appendChild(styleElement);
  }

  protected generateDom() {
    if (!this._container) {
      return;
    }

    const {engine, game, camera, world, level, physic} = this._info;

    this._infoDiv.innerHTML = `
<div class="sein-system-monitor-block">
  <h2>Engine</h2>
  <ul>
    <li>FPS: ${engine.fps.toFixed(0)}</li>
    <li>Ticker: ${engine.tickerRunning ? 'Running' : 'Paused'}</li>
    <li>Games: ${engine.gamesCount}</li>
    <li>RunningGames: ${engine.runningGamesCount}</li>
  </ul>
</div>

<div class="sein-system-monitor-block">
  <h2>Game</h2>
  <ul>
    <li>Name: ${game.name}</li>
    <li>State: ${!game.paused ? 'Running' : 'Paused'}</li>
    <li>Actors: ${game.actorsCount}</li>
  </ul>
</div>

<div class="sein-system-monitor-block">
  <h2>Camera</h2>
  ${camera.map(c => {
    return `
  <ul>
    <li>Name: ${c.name}</li>
    <li>Owner: ${c.ownerName}</li>
    <li>State: ${c.alive ? 'Alive' : 'Dead'}</li>
  </ul>
    `
  })}
</div>

<div class="sein-system-monitor-block">
  <h2>World</h2>
  <ul>
    <li>Name: ${world.name}</li>
  </ul>
</div>

<div class="sein-system-monitor-block">
  <h2>Level</h2>
  <ul>
    <li>Name: ${level.name}</li>
    <li>State: ${level.alive ? 'Alive' : 'Dead'}</li>
    <li>Actors: ${level.actorsCount}</li>
  </ul>
</div>

<div class="sein-system-monitor-block">
  <h2>Physic</h2>
  <ul>
    <li>State: ${!physic.active ? 'Disabled' : physic.alive ? 'Alive' : 'Dead'}</li>
  </ul>
</div>
    `
  }

  /**
   * 销毁，继承请先`super.onDestroy()`。
   */
  public onDestroy() {
    this._container.removeChild(this._infoDiv);

    if (this._actor) {
      this._actor.removeFromParent();
    }
  }
}
