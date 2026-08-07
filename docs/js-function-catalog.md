# JavaScript Function Catalog

This document lists the functions in the workspace's JavaScript files and gives each one a short purpose summary for quick reference.

## [app.js](../js/app.js)

| Function | Purpose |
|----------|---------|
| `updateFloatingToolbarViewportOffset()` | Adjusts the floating toolbar viewport offset CSS variable from the visual viewport height |
| `bindFloatingToolbarViewportOffset()` | Binds viewport resize and scroll listeners to keep the toolbar offset updated |
| `createDefaultMemoStore()` | Returns the default memo storage schema with blocks and content fields |
| `normalizeBlocks()` | Validates and normalizes a blocks array so each item has the expected shape |
| `textToBlocks()` | Converts plain text with markdown and checkbox syntax into a blocks array |
| `blocksToText()` | Converts a blocks array back into markdown text with checkbox notation |
| `escapeHtml()` | Escapes HTML special characters for safe rendering |
| `htmlToPlainText()` | Extracts plain text from HTML and handles lists and block elements |
| `normalizeRichHtml()` | Ensures HTML is valid or falls back to an empty paragraph |
| `blocksToRichHtml()` | Converts blocks into HTML with task lists and paragraphs |
| `htmlToBlocks()` | Parses HTML back into blocks and preserves task checked state |
| `migrateMemoStore()` | Updates old memo schema data to the current version and normalizes fields |
| `getMemoStore()` | Reads memo data from localStorage and returns the migrated store |
| `saveMemoStore()` | Saves a memo store to localStorage as JSON |
| `getQuillEditor()` | Returns a Quill editor instance from the memo editor map |
| `getActiveMemoQuill()` | Returns the active memo's Quill editor or null |
| `clearFloatingToolbarHideTimer()` | Clears the pending floating toolbar hide timeout |
| `showFloatingToolbar()` | Shows the floating toolbar and updates viewport offset |
| `hideFloatingToolbar()` | Hides the floating toolbar and optionally clears the active editor |
| `scheduleHideFloatingToolbar()` | Delays hiding the floating toolbar |
| `setActiveMemoEditor()` | Sets the active memo and shows the floating toolbar |
| `updateMemoTitleAndSidebar()` | Updates the memo header title and sidebar after changes |
| `saveMemoFromDom()` | Extracts Quill content and saves it, then updates title and sidebar |
| `showMemoThinScrollbar()` | Shows the memo scrollbar briefly and then hides it |
| `focusMemoEditorAtEnd()` | Focuses the memo editor and moves the cursor to the end |
| `bindFloatingToolbar()` | Initializes the floating toolbar buttons and icons |
| `toggleInlineFormat()` | Toggles inline formatting such as bold, italic, underline, or strike |
| `toggleChecklistFormat()` | Toggles between list and checklist format |
| `applyLineFormat()` | Applies a line format such as text alignment |
| `syncFloatingToolbarState()` | Updates floating toolbar button states from the current format |
| `focusMemoLine()` | Alias for focusing the memo editor at the end |
| `bindMemoMainInteractions()` | Binds click and scroll handlers to the memo container |
| `renderMemoEditor()` | Loads the memo store and renders HTML content in Quill |
| `initMemoEditor()` | Initializes the Quill editor and stores its reference |
| `apptext()` | Converts text input to blocks and renders it in the editor |
| `apptextKeydown()` | Legacy compatibility no-op |

## [box-ctrl.js](../js/box-ctrl.js)

| Function | Purpose |
|----------|---------|
| `bsClick()` | Closes open box panels and resets fullsize state when the board is clicked |
| `applyBoxLayoutByState()` | Updates a box's CSS position and size from stored state |
| `applyHiddenState()` | Applies hidden layout and class state based on the box object |
| `animateHideBox()` | Animates a box hiding with scale and opacity transitions |
| `animateShowBox()` | Animates a box showing with a scale transition |
| `animateShowFromSidebar()` | Animates a box showing from the sidebar, with a fallback path |
| `touchMemoUpdatedAt()` | Updates a memo's `updatedAt` timestamp |
| `formatMemoDate()` | Formats a timestamp into a readable date string |
| `renderMemoMeta()` | Updates folder, created, and updated metadata in the UI |
| `renderAllMemoMeta()` | Renders metadata for every memo in `bxArr` |
| `closeAllMemoFolderPickers()` | Closes all open folder picker dropdowns |
| `renderMemoFolderPicker()` | Builds the folder picker dropdown UI for a memo |
| `toggleMemoFolderPicker()` | Opens or closes a memo's folder picker |
| `setMemoFolderFromPicker()` | Moves a memo to the selected folder and updates the UI |
| `bxM()` | Toggles a memo's hidden state and saves the result |
| `setMemoHiddenState()` | Sets one memo's hidden state with optional save and sidebar controls |
| `setBulkMemoHiddenState()` | Applies hidden state changes to multiple memos |
| `bxX()` | Opens the deletion confirmation popup |
| `bxXCancel()` | Closes the deletion confirmation popup |
| `bxXConfirm()` | Deletes a memo from localStorage and the DOM |
| `bxclick()` | Attaches click handlers to boxes to manage z-index behavior |
| `showHiddenBox()` | Reveals a hidden memo box and applies the show animation |
| `saveBoxZTLWH()` | Saves a box's z-index, position, and size to the object and storage |
| `bxF()` | Toggles a box between fullsize and response state |
| `clearActiveBoxDrag()` | Removes active drag event listeners |
| `clearActiveBoxResize()` | Removes active resize event listeners |
| `boxDragging()` | Handles dragging with bounds checking and z-index updates |
| `boxResizeStart()` | Handles resizing from a direction with size constraints |
| `bxSetTitle()` | Updates a memo title and syncs the header and sidebar |
| `applyTitleVisibility()` | Applies the title visibility style from the `showTitle` flag |
| `bxToggleTitleVisibility()` | Toggles title visibility and saves the state |
| `getDisplayTitle()` | Returns the memo title from its name or first content line |
| `getHeaderDisplayTitle()` | Returns the display title or an empty string if default |
| `bxFavorite()` | Toggles the favorite flag and updates the button |
| `bxAlwaysTop()` | Toggles the always-on-top flag and z-index behavior |
| `bxLock()` | Toggles the lock flag and disables drag interactions |

## [box.js](../js/box.js)

| Function | Purpose |
|----------|---------|
| `isMobileViewport()` | Returns true when the viewport width is 500px or less |
| `pickTopVisibleBoxId()` | Finds the topmost non-hidden memo by z-index |
| `applyMobileMemoLayout()` | Marks one memo as active in mobile view and clears it on desktop |
| `newBox()` | Creates a new centered memo with default dimensions and adds it to the DOM |
| `saveBxArr()` | Saves `bxArr` to localStorage |
| `addNewBox()` | Creates the DOM elements for a new memo and initializes related UI |
| `printBx()` | Renders an existing memo box from a stored object on page load |
| `loadBox()` | Loads `bxArr` from localStorage, migrates it, and renders boxes |
| `migrateBxArr()` | Updates old memo object schema values to the current version |

## [sidebar.js](../js/sidebar.js)

| Function | Purpose |
|----------|---------|
| `isPinnedLeftOpen()` | Returns true if the left sidebar is pinned and open on desktop |
| `updateRightBackdropsOffset()` | Updates the backdrop offset based on pinned sidebar width |
| `memoRef()` | Builds a memo reference string |
| `folderRef()` | Builds a folder reference string |
| `parseRef()` | Parses a reference string into a type and id |
| `isMemoRef()` | Returns true if a reference points to a memo |
| `isFolderRef()` | Returns true if a reference points to a folder |
| `ensureLwTreeShape()` | Validates and normalizes the sidebar tree structure |
| `loadLwTree()` | Loads the sidebar tree from localStorage |
| `saveLwTree()` | Saves the sidebar tree to localStorage |
| `getMemoPreviewById()` | Returns a short text preview for a memo |
| `syncLwTreeWithMemos()` | Removes orphan references and ensures all memos exist in the tree |
| `removeRefFromTree()` | Removes a reference from the root or folder lists |
| `insertRefAt()` | Inserts a reference at a given position in the tree |
| `clearLwDropClasses()` | Removes drag-drop indicator classes from sidebar elements |
| `shouldIgnoreSidebarItemClick()` | Returns true when a click should be ignored after a drop action |
| `getMemoFolderLabel()` | Returns a folder label or 루트 if the memo is not in a folder |
| `getMemoFolderId()` | Returns the folder id for a memo or null for root |
| `listSidebarFolders()` | Returns all folder objects from the tree |
| `moveMemoToFolder()` | Moves a memo reference to a folder or back to root |
| `applyDropToTree()` | Applies drag-drop reordering and folder constraints |
| `makeListDnDHandlers()` | Attaches drag-drop handlers to a sidebar item |
| `toggleFolderCollapsed()` | Toggles a folder's collapsed state |
| `askFolderName()` | Shows a modal dialog to collect a folder name |
| `sidebarNewFolder()` | Creates a new folder from user input |
| `sidebarRenameFolder()` | Opens a dialog to rename an existing folder |
| `removeMemoEverywhere()` | Deletes a memo from storage, the tree, and the DOM |
| `askDeleteFolderOptions()` | Shows a confirmation dialog for folder deletion options |
| `sidebarDeleteFolder()` | Deletes a folder and optionally its contained memos |
| `toggleSidebar()` | Toggles the left sidebar open or closed |
| `openSidebar()` | Opens the sidebar and renders its content |
| `closeSidebar()` | Closes the sidebar unless it is pinned or forced closed |
| `loadLwSettings()` | Loads sidebar settings from localStorage |
| `saveLwSettings()` | Saves sidebar settings to localStorage |
| `updateLwSettingsUi()` | Updates the sidebar settings button states |
| `toggleLwSettings()` | Toggles the sidebar settings panel |
| `closeLwSettings()` | Closes the sidebar settings panel |
| `toggleLwPreview()` | Toggles memo preview display in the sidebar |
| `getAllSidebarMemoIds()` | Returns all memo ids from `bxArr` |
| `getFolderMemoIds()` | Returns all memo ids inside a folder |
| `countVisibleMemoIds()` | Counts the visible memos in an id list |
| `isOnlyMemoSetVisible()` | Returns true if only a specific memo set is visible |
| `updateSidebarVisibilityButton()` | Updates a visibility toggle button state and label |
| `updateAllSidebarVisibilityButton()` | Updates the main visibility button for all memos |
| `toggleAllSidebarMemosVisibility()` | Toggles hidden state for all memos |
| `toggleFolderMemoVisibility()` | Toggles hidden state for memos in one folder |
| `toggleFolderOnlyVisible()` | Shows only the selected folder's memos |
| `togglePin()` | Pins or unpins the left sidebar |
| `renderSidebar()` | Renders the full sidebar with folders, memos, search, and drag-drop |
| `focusBox()` | Brings a memo to the top and shows it if hidden |
| `sidebarNewMemo()` | Creates a new memo and refreshes the sidebar |
| `lwSearch()` | Updates the search query and re-renders the sidebar |
| `toggleRw()` | Toggles the right settings sidebar |
| `openRw()` | Opens the right settings sidebar |
| `closeRw()` | Closes the right settings sidebar |
| `toggleWw()` | Toggles the theme/info sidebar |
| `openWw()` | Opens the theme/info sidebar |
| `closeWw()` | Closes the theme/info sidebar |
| `openBgModal()` | Opens the background modal and renders the current tab |
| `closeBgModal()` | Closes the background modal |
| `switchBgTab()` | Switches between the background modal tabs |
| `normalizeSavedBgLinks()` | Validates and deduplicates saved background URLs |
| `loadSavedBgLinks()` | Loads saved background links from localStorage |
| `saveSavedBgLinks()` | Saves background links to localStorage |
| `renderSavedBgLinks()` | Renders saved background URLs with action buttons |
| `removeSavedBgLink()` | Removes one saved background link by index |
| `getBgLinkInputValue()` | Reads and trims the background link input value |
| `isValidUrl()` | Returns true when a string is a valid URL |
| `renderBgLibrary()` | Renders the background library grid with filtering |
| `applyLibraryBackground()` | Applies a library background and refreshes the grid |
| `handleBgUpload()` | Handles custom background image file upload |
| `applyBgLink()` | Validates and applies a background from a URL |
| `saveBgLink()` | Saves the current link input to the saved list |
| `clearCustomBackground()` | Restores the default theme background |
| `setBodyBackground()` | Sets the body background image CSS property |
| `applyBackgroundMode()` | Sets the background mode and applies related CSS |
| `loadBackgroundSetting()` | Loads and applies the saved background on startup |
| `validateImageUrl()` | Returns a promise that resolves after checking whether an image loads |
| `openBgDb()` | Opens the IndexedDB database for background storage |
| `saveBackgroundBlob()` | Saves a background image blob to IndexedDB |
| `getBackgroundBlob()` | Retrieves a background image blob from IndexedDB |
| `setBackupStatus()` | Sets the backup operation status message in the UI |
| `blobToDataUrl()` | Converts a blob to a data URL |
| `dataUrlToBlob()` | Converts a data URL string back to a Blob |
| `snapshotLocalStorage()` | Creates a copy of all localStorage items |
| `readAllBackgroundRecords()` | Reads every background blob record from IndexedDB |
| `replaceBackgroundRecords()` | Clears and replaces all background records |
| `downloadBackupFile()` | Creates a blob and triggers a browser download |
| `exportAppBackup()` | Exports a full backup of localStorage and backgrounds |
| `triggerBackupImport()` | Programmatically triggers the backup file input |
| `handleBackupImport()` | Imports a backup file and restores localStorage and backgrounds |
| `setTheme()` | Sets the body theme class and saves it to localStorage |
| `loadTheme()` | Loads the saved theme from localStorage |
| `pushPanelHistory()` | Pushes the current panel state into browser history |

## [toolbar.js](../js/toolbar.js)

| Function | Purpose |
|----------|---------|
| `getDefaultClockSettings()` | Returns the default clock settings object |
| `normalizeClockSettings()` | Validates and normalizes raw clock settings |
| `loadClockSettings()` | Loads clock settings from localStorage |
| `saveClockSettings()` | Saves clock settings to localStorage |
| `renderClockSettingsControls()` | Updates the clock settings UI controls |
| `setClockFieldEnabled()` | Updates clock field visibility and saves the setting |
| `setClockHourFormat()` | Sets 12-hour or 24-hour display mode |
| `initClockSettings()` | Loads clock settings, renders controls, and binds listeners |
| `getTime()` | Updates the top time display with the current formatted time |
| `renderMiniCalendar()` | Generates the mini calendar HTML with today's date highlighted |
| `toggleMiniCalendar()` | Opens or closes the mini calendar dropdown |
| `closeMiniCalendar()` | Closes the mini calendar and resets to the current month |
| `changeMiniCalendarMonth()` | Changes the mini calendar month by a delta |
| `updateWidgetDots()` | Updates the active state of widget carousel dots |
| `setWidgetSlide()` | Scrolls the widget carousel to a given slide |
| `initWidgetSwipe()` | Binds scroll behavior to keep widget slide state in sync |
| `getVisibleWidgetSlides()` | Returns the widget slides that are not hidden |
| `getDefaultWidgetSettings()` | Returns the default widget order and enabled state |
| `normalizeWidgetSettings()` | Validates and normalizes widget settings |
| `loadWidgetSettings()` | Loads widget settings from localStorage |
| `saveWidgetSettings()` | Saves widget settings to localStorage |
| `applyWidgetSettings()` | Reorders widgets and applies display settings |
| `rebuildWidgetDots()` | Regenerates widget carousel dots |
| `moveWidgetEngineByDrop()` | Reorders widgets using drag and drop |
| `setWidgetEngineEnabled()` | Enables or disables a widget engine |
| `renderWidgetSettingsList()` | Renders the widget settings list with drag handles |
| `toggleWidgetSettings()` | Toggles the widget settings panel |
| `closeWidgetSettings()` | Closes the widget settings panel |
| `initWidgetSettings()` | Loads, renders, and applies widget settings |
| `initWidgetSearchClear()` | Clears the search input after form submission |

## [top_calender.js](../js/top_calender.js)

| Function | Purpose |
|----------|---------|
| `renderCalendar()` | Renders the calendar grid for the current month and highlights today |
