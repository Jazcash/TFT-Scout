import { OWGamesEvents } from "@overwolf/overwolf-api-ts/dist";

declare var window: any;

interface Player {
    name: string;
    box: HTMLElement;
}

interface PlayerData{
    index: number;
    name: string;
    health: number;
    xp: number;
}

export class Overlay {
    private players: Player[] = [];
    private selfName: string = "";
    private tftListener: any;

    constructor() {
        this.setup();

        this.setDebug();
    }

    private setup(){
        this.tftListener = new OWGamesEvents({
            onInfoUpdates: ((res) => {
                console.debug("1", res);
                if (res.gameChanged){
                    this.players = [];
                }
                if (this.gameLaunched(res)) {
                    // this.registerEvents();
                    // setTimeout(() => this.setFeatures(), 1000);
                    console.log(res);
                    this.handleEvent(res.event.info[0]);
                }
            }),
            onNewEvents: ((event) => {
                this.handleEvent(event.info[0]);
            }),
        }, ["roster", "match_info"]);
        
        // overwolf.games.onGameInfoUpdated.addListener((res) => {
        //     console.debug("1", res);
        //     if (res.gameChanged){
        //         this.players = [];
        //     }
        //     if (this.gameLaunched(res)) {
        //         this.registerEvents();
        //         setTimeout(() => this.setFeatures(), 1000);
        //     }
        // });

        overwolf.games.getRunningGameInfo((res) => {
            //console.debug("2", res);
            if (this.gameRunning(res)) {
                this.registerEvents();
                setTimeout(() => this.setFeatures(), 1000);
            } else {
                this.players = [];
            }
        });

        overwolf.games.launchers.events.getInfo(10902, info => {
            if (info.success){
                this.selfName = info.res.summoner_info.display_name;
            }
        });

        this.setPosition();
    }

    private setFeatures() {
        overwolf.games.events.setRequiredFeatures(["roster", "match_info"], (info: any) => {
            if (!info.success) {
                console.log("Could not set required features: " + info.reason);
                console.log("Trying in 2 seconds");
                window.setTimeout(() => this.setFeatures(), 2000);
                return;
            }

            console.log("Set required features:");
            console.log(JSON.stringify(info));
        });
    }

    private handleEvent(info: any){
        const feature = info.feature;
        const key = info.key;

        if (feature === "roster" && key === "player_status"){
            this.handleRoster(info.value);
        } else if (feature === "match_info" && key === "opponent"){
            this.setLastOpponent(info.value);
        }
    }

    private handleRoster(jsonStr: string){
        const roster = JSON.parse(jsonStr);

        const players: Array<PlayerData> = [];

        for (const name in roster){
            const playerData: PlayerData = roster[name];
            playerData.name = name;

            players.push(playerData);
        }

        players.sort((a, b) => a.index - b.index);

        if (players.length){
            if (this.players.length && players.length){
                this.updateRoster(players);
            } else {
                this.setupRoster(players);
            }
        }
    }

    private async setupRoster(players: PlayerData[]){
        console.info("Initialising roster", players);

        if (!this.selfName){
            this.selfName = await this.getSummonerName();
        }
        
        this.reset();

        players.forEach((data, i) => {
            if (data.name !== this.selfName){
                const box = document.querySelector(`#box-${i}`) as HTMLElement;
                const player: Player = { name: data.name, box: box };
                player.box.style.borderColor = "green";
                this.players.push(player);
            }
        });

        this.setPosition();
    }

    private updateRoster(players: PlayerData[]){
        console.info("Updating roster");

        this.players.forEach(player => {
            players.forEach(data => {
                if (player.name === data.name && data.health <= 0){
                    this.removePlayer(data.name.trim());
                }
            });
        });
    }

    private removePlayer(name: string){
        console.info(`Removing: ${name}`);

        const player = this.players.find(player => player.name.trim() === name.trim());
        const index = this.players.indexOf(player);

        if (index !== -1){
            this.players.splice(index, 1);
            player.box.style.borderColor = "transparent";
            this.clear();
        }
    }

    private setLastOpponent(jsonStr: string){
        if (this.players.length === 0){
            return;
        }

        const opponentName = JSON.parse(jsonStr).name.trim();
        const opponent = this.players.find(player => player.name === opponentName);
        const index = this.players.indexOf(opponent);

        console.log(`LAST OPPONENT WAS ${opponentName}`);

        if (index !== -1){
            this.players.splice(index, 1);
            this.players.push(opponent);
            opponent.box.style.borderColor = "red";
        }

        this.updateOverlay();
    }

    private updateOverlay(){
        const potentialCount = this.players.length > 3 ? 3 : this.players.length - 1;

        this.players.slice(0, potentialCount).forEach(player => {
            player.box.style.borderColor = "green";
        });
    }

    private clear(){
        console.log(`A player was eliminated, clearing`);

        this.players.forEach(player => {
            player.box.style.borderColor = "green";
        });
    }

    private reset(){
        console.log("Reset");

        document.querySelectorAll(`.box`).forEach((box: any) => box.style.borderColor = "transparent");

        this.players = [];
    }

    private setDebug(){
        // const debugEl: HTMLElement = document.querySelector(".debug");
        // debugEl.innerHTML = `${this.selfName}<br>${this.players.map(player => player.name).join("<br>")}`;

        // setTimeout(() => this.setDebug(), 1000);
    }

    private registerEvents() {
        console.log("register events");

        overwolf.games.events.onInfoUpdates.addListener((event) => {
            this.handleEvent(event.info[0]);
        });
    }

    private gameLaunched(gameInfoResult) {
        if (!gameInfoResult) {
            return false;
        }

        if (!gameInfoResult.gameInfo) {
            return false;
        }

        if (!gameInfoResult.runningChanged && !gameInfoResult.gameChanged) {
            return false;
        }

        if (!gameInfoResult.gameInfo.isRunning) {
            return false;
        }

        // NOTE: we divide by 10 to get the game class id without it's sequence number
        if (Math.floor(gameInfoResult.gameInfo.id / 10) != 5426) {
            return false;
        }

        console.log("TFT Launched");
        return true;

    }

    private gameRunning(gameInfo) {

        if (!gameInfo) {
            return false;
        }

        if (!gameInfo.isRunning) {
            return false;
        }

        // NOTE: we divide by 10 to get the game class id without it's sequence number
        if (Math.floor(gameInfo.id / 10) != 5426) {
            return false;
        }

        console.log("TFT running");
        return true;

    }

    private async setPosition() {
        const gameRes = await this.getGameResolution();

        if (gameRes === null){
            return;
        }

        const appRes = await this.getAppResolution();

        overwolf.windows.changeSize("overlay", 350, 170)
        overwolf.windows.changePosition("overlay", gameRes.width - appRes.width, gameRes.height - appRes.height);
    }

    private getGameResolution(): Promise<{ width: number, height: number }> {
        return new Promise(resolve => {
            overwolf.games.getRunningGameInfo((result) => {
                if (result && result.logicalWidth){
                    resolve({
                        width: result.logicalWidth,
                        height: result.logicalHeight
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    private getAppResolution(): Promise<{ width: number, height: number }> {
        return new Promise(resolve => {
            overwolf.windows.getCurrentWindow((result) => {
                resolve({
                    width: result.window.width,
                    height: result.window.height
                });
            });
        });
    }

    private getSummonerName() : Promise<string> {
        return new Promise(resolve => {
            overwolf.games.launchers.events.getInfo(10902, info => {
                if (info.success){
                    resolve(info.res.summoner_info.display_name);
                } else {
                    setTimeout(() => {
                        console.log("Failed to get summoner name, trying again in 2s");
                        resolve(this.getSummonerName());
                    }, 2000);
                }
            });
        });
    }
}

export const overlay = new Overlay();
window.overlay = overlay;