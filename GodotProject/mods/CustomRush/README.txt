Custom Rush by andy6170 Version 4.0
================================================================================================================
Just want to play?
Rush Template: z9qq1
Fort Lyndon Collection: z9qs8

Included is the full package to get you started.
The 3 folders contain the full content for Custom Rush.

Godot Spatial Editor Scene:
This includes the tscn level for Godot. Extract the file to:
GodotProject\levels


Exported Maps:
There are instances where copying the experience may not keep the map attached.
If this happens you an use the included JSON map already exported and upload it to the portal website in the map rotation.


Portal Blocks:
When some people open the experience link they are unable to see the blocks.
If this happens you can import the included JSON of the template onto the Portal website within the block editor via the Import button.


ObjID Assignment:

Example for 3 sectors:
+--------------+----------+----------+----------+----------+--------------+
| Item         | Sector 0 | Sector 1 | Sector 2 | Sector 3 | Final Sector |
+--------------+----------+----------+----------+----------+--------------+
| Sector       | 100      | 101      | 102      | 103      | 104          |
| Area Trigger | 600      | 601      | 602      | 603      | 604          |
| MCOM1        | N/A      | 201      | 203      | 205      | N/A          |
| MCOM2        | N/A      | 202      | 204      | 206      | N/A          |
| Team1HQ      | N/A      | 301      | 302      | 303      | N/A          |
| Team2HQ      | N/A      | 401      | 402      | 403      | N/A          |
| Vehicles     | N/A      | 1100-1199| 1200-1299| 1300-1399| N/A          |
| End Game Cam | 950      | N/A	     | N/A	| N/A	   | N/A          |
| VFX          | 2000-2999| N/A      | N/A      | N/A      | N/A          |
| Team Switcher| 990-999  | N/A      | N/A      | N/A      | N/A          |
+--------------+----------+----------+----------+----------+--------------+

Knows Issues:
Armed/Disarmed has custom tracking so may not be 100% accurate. This is down to the game not tracking EventPlayer on MCOM Armed/Defused.
Kill assists and Defib Revives are not tracked due to in game bugs.
Objective UI is above sector UI. This is hard coded and cannot be moved.

================================================================================================================
================================================================================================================

Changes in this update:

V4.0
- Spatials updated for 1.4.2.0
- Added Rush Prefab to drag and drop into maps
- Official MCOM HUD added (location is fixed so sector UI is now underneath)
- UI no longer flashes when a player joins
- UI progress and timer design has been updated
- Added end game camera (ObjID 950)
- Added AI difficulty (1 Easy | 2 Default | 3 Hard | 4 Impossible)
- Sectors now use HQs to draw colours on the map
- New VO announcer events added to feedback MCOM status
- Added night mode toggle
- Added random day/night toggle and percentage controls
- Added NVG option
- Added Gas mask option
- Defenders will now be spotted until they retreat
- Fixed Overtime not ending when MCOMs have been destroyed
- Fixed FX not being activated
- Team switcher range increased ObjID(990-999)
- Players who arm/defuse/destroy now earn points
- Scoreboard values updated to be closer to official scoring (kill assists and revives are still bugged)
- Performance improvements

New Maps:
Cairo Bazaar (BF3 layout remake)
Eastwood



================================================================================================================
================================================================================================================

Previous Update Changes:

V3.1
- Fix skip mandown bug
- Added Team Switcher logic
- Previous sector is now disabled from the map
- Tickets will no longer go below 0



V3.0
- Reworked logic for Season 2 update
- Auto enable FX added. Assign them ObjID 2000-2999
- Overhauled Player UI for Out of Bounds
- Players now have truly unique IDs for UI to prevent clashing
- MCOMs should now correctly only activate per sector
- Snow toggle and colour filter added



V2.0
- Overhauled out of bounds with new logic (delete the Combat Area in Godot)
- Added support for vehicles per sector
- A toggle VehicleCleanup has been added to destroy unoccupied vehicles from the previous sector
- Additional VO announcers added
- New UI animation when tickets bleed
- Fixed deaths tracking on the scoreboard
- Experimental colour filters available for BF3/BF4 looks (best for Redsec maps)
- Overhauled the UI logic to be more efficient
- Defenders UI infinity symbol will now be centre
- Time position had been adjusted to better fit the compass

To add vehicles, assign them an ObjID within the range for the desired sector. 
For example:
Sector 1 - 1100-1199
Sector 2 - 1200-1299
Sector 3 - 1300-1399