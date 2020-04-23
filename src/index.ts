/**
 * @File   : index.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 10/25/2018, 11:37:51 AM
 * @Description:
 */
import * as Sein from 'seinjs';

import ICannonDebugRenderer from './Physic/CannonDebugRenderer';
import IDrawerActor from './Physic/DrawerActor';
import ISystemMonitorActor, {
  ISystemMonitorInfo as IISystemMonitorInfo,
  ISystemMonitorActorOptions as IISystemMonitorActorOptions
} from './System/SystemMonitorActor';

declare module 'seinjs' {
  export namespace DebugTools {
    export class CannonDebugRenderer extends ICannonDebugRenderer {}
    export class DrawerActor extends IDrawerActor {}
    export class SystemMonitorActor extends ISystemMonitorActor {}
    export interface ISystemMonitorInfo extends IISystemMonitorInfo {}
    export interface ISystemMonitorActorOptions extends IISystemMonitorActorOptions {}
  }
}

(Sein as any).DebugTools = {
  CannonDebugRenderer: ICannonDebugRenderer,
  DrawerActor: IDrawerActor,
  SystemMonitorActor: ISystemMonitorActor
};

export {
  ICannonDebugRenderer as CannonDebugRenderer,
  IDrawerActor as DrawerActor,
  ISystemMonitorActor as SystemMonitorActor,
  IISystemMonitorInfo as ISystemMonitorInfo,
  IISystemMonitorActorOptions as ISystemMonitorActorOptions
}
