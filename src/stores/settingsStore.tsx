import { DeskThing } from "@deskthing/client";
import { AppSettings, DEVICE_CLIENT, DeviceToClientCore, SocketData } from "@deskthing/types";

type SettingListener = (data: AppSettings) => Promise<void>;
type TimeListener = (data: string) => Promise<void>;

export class SettingsStore {
  private static instance: SettingsStore;
  private listeners: ((data: SocketData) => void)[] = [];
  private settingsListeners: SettingListener[] = [];
  private timeListeners: TimeListener[] = [];
  private currentSettings: AppSettings | null = null;
  private time: string = "00:00 AM";

  constructor() {
    this.listeners.push(
      DeskThing.on(DEVICE_CLIENT.SETTINGS, this.handleSetting.bind(this))
    );
    this.listeners.push(
      DeskThing.on(DEVICE_CLIENT.TIME, this.handleClient.bind(this))
    );
  }

  static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
    }
    return SettingsStore.instance;
  }

  private handleSetting(
    data: Extract<DeviceToClientCore, { type: DEVICE_CLIENT.SETTINGS }>
  ) {
    this.currentSettings = data.payload;
    if (this.currentSettings != null) {
      this.settingsListeners.forEach((listener) =>
        listener(this.currentSettings as AppSettings)
      );
    }
  }

  private handleClient(
    data: Extract<DeviceToClientCore, { type: DEVICE_CLIENT.TIME }>
  ) {
    if (typeof data.payload != "string") return;
    this.time = data.payload;
    this.timeListeners.forEach((listener) => listener(this.time));
  }

  getSettings(): AppSettings | null {
    if (!this.currentSettings) {
      DeskThing.send({
        app: "client",
        type: "get",
        request: "settings",
      });
    }
    return this.currentSettings;
  }

  getTime(): string {
    DeskThing.send({ app: "server", type: "get" });
    return this.time;
  }

  on(listener: SettingListener): () => void {
    this.settingsListeners.push(listener);
    return () => {
      this.settingsListeners = this.settingsListeners.filter(
        (l) => l !== listener
      );
    };
  }
  off(listener: SettingListener) {
    this.settingsListeners = this.settingsListeners.filter(
      (l) => l !== listener
    );
  }

  onTime(listener: TimeListener): () => void {
    this.timeListeners.push(listener);
    return () => {
      this.timeListeners = this.timeListeners.filter((l) => l !== listener);
    };
  }
  offTime(listener: TimeListener) {
    this.timeListeners = this.timeListeners.filter((l) => l !== listener);
  }
}

export default SettingsStore.getInstance();
