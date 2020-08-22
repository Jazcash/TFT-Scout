declare var window: any;

interface Player {
    name: string;
    box: HTMLElement;
}

interface PlayerData{
    index: number;
    name: string;
    health: number;
}

export class Overlay {
    private players: Player[] = [];
    private selfName: string = "";

    constructor() {
        this.setup();
    }

    private setup(){
        overwolf.games.onGameInfoUpdated.addListener((res) => {
            if (this.gameLaunched(res)) {
                this.registerEvents();
                setTimeout(() => this.setFeatures(), 1000);
            }
        });

        overwolf.games.getRunningGameInfo((res) => {
            if (this.gameRunning(res)) {
                this.registerEvents();
                setTimeout(() => this.setFeatures(), 1000);
            }
        });

        overwolf.games.launchers.events.getInfo(10902, info => {
            if (info.success){
                this.selfName = info.res.summoner_info.display_name;
            }
        });
    }

    private setFeatures() {
        overwolf.games.events.setRequiredFeatures(["roster", "match_info"], (info: any) => {
            if (!info.success) {
                overwolf.log.info("Could not set required features: " + info.reason);
                overwolf.log.info("Trying in 2 seconds");
                window.setTimeout(() => this.setFeatures(), 2000);
                return;
            }

            overwolf.log.info("Set required features:");
            overwolf.log.info(JSON.stringify(info));
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

        if (this.players.length){
            this.updateRoster(players);
        } else {
            this.setupRoster(players);
        }
    }

    private setupRoster(players: PlayerData[]){
        console.info("Initialising roster");

        players.forEach((data, i) => {
            if (data.name !== this.selfName && data.health > 0){
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
                if (data.health <= 0){
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
            player.box.style.visibility = "hidden";
            this.reset();
        }
    }

    private setLastOpponent(jsonStr: string){
        if (this.players.length === 0){
            return;
        }

        const opponentName = JSON.parse(jsonStr).name.trim();
        const opponent = this.players.find(player => player.name === opponentName);
        const index = this.players.indexOf(opponent);

        overwolf.log.info(`LAST OPPONENT WAS ${opponentName}`);

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

    private reset(){
        overwolf.log.info(`A player was eliminated, resetting `);

        this.players.forEach(player => {
            player.box.style.borderColor = "green";
        });
    }

    private registerEvents() {
        overwolf.log.info("register events");

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

        overwolf.log.info("TFT Launched");
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

        overwolf.log.info("TFT running");
        return true;

    }

    private async setPosition() {
        const gameRes = await this.getGameResolution();
        const appRes = await this.getAppResolution();

        overwolf.windows.changeSize("overlay", 160, 160)
        overwolf.windows.changePosition("overlay", gameRes.width - appRes.width, gameRes.height - appRes.height);
    }

    private getGameResolution(): Promise<{ width: number, height: number }> {
        return new Promise(resolve => {
            overwolf.games.getRunningGameInfo((result) => {
                resolve({
                    width: result.logicalWidth,
                    height: result.logicalHeight
                });
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
}

export const overlay = new Overlay();
window.overlay = overlay;