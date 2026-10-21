//Consts
const TEAM1 = mod.GetTeam(1);
const TEAM2 = mod.GetTeam(2);

//References
let bombReference: mod.Bomb;
let gruntReference: mod.Player;
let playerReference: mod.Player;
let MCOMReference: mod.MCOM;
let MCOMOwner: mod.Team;

//States
let AIHasBomb = false;
let isMCOMArmTypeBomb = false;
let isBombSpawnedIn = false;

const worldIconDetails = [
    {
        id: 41,
        msg: mod.Message('SPAWN BOMB'),
    },
    {
        id: 42,
        msg: mod.Message('(TOGGLE) GIVE BOMB TO PLAYER'),
    },
    {
        id: 43,
        msg: mod.Message('FORCE BOMB DROP'),
    },
    {
        id: 44,
        msg: mod.Message('BOMB RESET'),
    },
    {
        id: 45,
        msg: mod.Message('CHANGE MCOM ARM TYPE'),
    },
    {
        id: 46,
        msg: mod.Message('SWITCH MCOM OWNER'),
    },
];

////////////////////
///// SETUP
////////////////////

export async function OnGameModeStarted() {
    //MCOM REFERENCE
    MCOMReference = mod.GetMCOM(30);
    MCOMOwner = TEAM2;
    mod.SetMCOMOwner(MCOMReference, MCOMOwner);

    //SPAWN TEST GRUNT
    const AISpawnerReference = mod.GetSpawner(10);
    mod.SpawnAIFromAISpawner(AISpawnerReference, mod.GetTeam(2));

    //ICON SETUP
    for (const iconDetail of worldIconDetails) {
        const worldIcon = mod.GetWorldIcon(iconDetail.id);
        mod.EnableWorldIconText(worldIcon, true);
        mod.SetWorldIconText(worldIcon, iconDetail.msg);
    }
}

export async function OnPlayerDeployed(eventPlayer: mod.Player) {
    if (mod.GetSoldierState(eventPlayer, mod.SoldierStateBool.IsAISoldier) === true) {
        gruntReference = eventPlayer;
        mod.AIEnableShooting(eventPlayer, false);
        mod.SetPlayerIncomingDamageFactor(eventPlayer, 0.05);
    } else {
        playerReference = eventPlayer;
    }
}

////////////////////
///// BOMB INTERACTIONS
////////////////////

export async function OnPlayerInteract(player: mod.Player, interactPoint: mod.InteractPoint) {
    //Spawns a new bomb and sets the fuse time
    if (mod.GetObjId(interactPoint) == 1) {
        if (!isBombSpawnedIn) {
            bombReference = mod.SpawnObject(mod.RuntimeSpawn_Common.Bomb, mod.CreateVector(-20, 33, 23), mod.CreateVector(0, 0, 0));
            mod.SetBombDropFuseTime(bombReference, 10);
            isBombSpawnedIn = true;
        }
    }

    //Gives a bomb to a player
    if (mod.GetObjId(interactPoint) == 2) {
        if (isBombSpawnedIn) {
            AIHasBomb = !AIHasBomb;
            if (!AIHasBomb) {
                mod.GiveBombToPlayer(gruntReference, bombReference);
            } else {
                mod.GiveBombToPlayer(playerReference, bombReference);
            }
        }
    }

    //Drops from a player, the fuse time will start
    if (mod.GetObjId(interactPoint) == 3) {
        mod.ForceBombDrop(bombReference);
    }

    //Resets bomb back to its original location and force spawns it
    if (mod.GetObjId(interactPoint) == 4) {
        mod.ForceBombReset(bombReference);
    }

    //Toggles between requiring bomb to arm and the default behavior
    if (mod.GetObjId(interactPoint) == 5) {
        isMCOMArmTypeBomb = !isMCOMArmTypeBomb;
        if (isMCOMArmTypeBomb) {
            mod.SetMCOMArmType(MCOMReference, mod.MCOMArmType.Default);
        } else {
            mod.SetMCOMArmType(MCOMReference, mod.MCOMArmType.Bomb);
        }
    }

    //Toggles owning team of MCOM
    if (mod.GetObjId(interactPoint) == 6) {
        MCOMOwner = MCOMOwner == TEAM1 ? TEAM2 : TEAM1;
        mod.SetMCOMOwner(MCOMReference, MCOMOwner);
    }
}

////////////////////
///// BOMB EVENTS
////////////////////

export async function OnBombPickedUp(Bomb: mod.Bomb, player: mod.Player) {
    AIHasBomb = mod.Equals(player, playerReference); //Next swap goes to AI
    console.log('Bomb Picked up');
}

export async function OnBombDropped(Bomb: mod.Bomb, player: mod.Player) {
    console.log('Bomb Dropped');
}

export function OnBombStateChanged(Bomb: mod.Bomb, state: mod.BombState) {
    if (mod.Equals(state, mod.BombState.Resetting)) {
        mod.UnspawnObject(bombReference);
        isBombSpawnedIn = false;
    }
}
