import type * as hb from "homebridge";
import * as miio from "miio-api";

import { BaseHumidifier } from "../humidifier";
import { Protocol, MiioProtocol } from "../protocols";
import { PlatformAccessory, DeviceOptions } from "../../platform";
import { ValueOf } from "../utils";

enum Mode {
  Off = -1,
  Level1 = 1,
  Level2 = 2,
  Level3 = 3,
  Level4 = 4,
  Level5 = 5,
  Intelligent = 0,
}

enum State {
  Off = 0,
  On = 1,
}

enum LedState {
  Off = 0,
  Dim = 1,
  Bright = 2,
}

enum WaterState {
  Enough = 0,
  AddWater = 1,
}

type Props = {
  temperature: number;
  humidity: number;
  mode: Mode;
  buzzer: State;
  child_lock: State;
  led_brightness: LedState;
  power: State;
  no_water: WaterState;
};

class Proto extends MiioProtocol<Props> {
  mapGetResults(results: Array<ValueOf<Props>>): Props {
    return {
      temperature: results[0],
      humidity: results[1],
      mode: results[2],
      buzzer: results[3],
      child_lock: results[4],
      led_brightness: results[5],
      power: results[6],
      no_water: results[7],
    };
  }

  prepareGetArgs(_props: Array<keyof Props>): string[] {
    return [];
  }
}

export class ShuiiHumidifierJSQ001 extends BaseHumidifier<Props> {
  protected getProtocol(device: miio.Device): Protocol<Props> {
    return new Proto(device);
  }

  configureAccessory(
    accessory: PlatformAccessory,
    api: hb.API,
    options: DeviceOptions,
  ): void {
    super.configureAccessory(accessory, api, options);
    const register = this.helper(accessory, api);

    register.currentState();
    register.targetState();
    register.active("power", "set_start", { on: State.On, off: State.Off });
    register.rotationSpeed("mode", "set_mode", {
      modes: [
        Mode.Off,
        Mode.Level1,
        Mode.Level2,
        Mode.Level3,
        Mode.Level4,
        Mode.Level5,
        Mode.Intelligent,
      ],
    });
    register.humidity("humidity");
    register.waterLevel("no_water", { toChar: (it) => it * 100 });
    register.lockPhysicalControls("child_lock", "set_lock", {
      on: State.On,
      off: State.Off,
    });

    if (options.ledBulb?.enabled) {
      register.ledBulb("led_brightness", "set_brightness", {
        name: options.ledBulb.name,
        modes: [LedState.Off, LedState.Dim, LedState.Bright],
        on: LedState.Dim,
        off: LedState.Off,
      });
    }

    if (options.buzzerSwitch?.enabled) {
      register.buzzerSwitch("buzzer", "set_buzzer", {
        name: options.buzzerSwitch.name,
        on: State.On,
        off: State.Off,
      });
    }

    if (options.humiditySensor?.enabled) {
      register.humiditySensor("humidity", {
        name: options.humiditySensor.name,
      });
    }

    if (options.temperatureSensor?.enabled) {
      register.temperatureSensor("temperature", {
        name: options.temperatureSensor.name,
        toChar: (it) => it,
      });
    }
  }
}