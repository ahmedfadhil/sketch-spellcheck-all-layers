@import 'sketch-nibui.js';

function onRun(context) {
  var sketch = context.api();
  var doc = context.document;
  var app = NSApplication.sharedApplication();
  var language = [[NSSpellChecker sharedSpellChecker] language]

  // Filter layers using NSPredicate
	var scope = (typeof containerLayer !== 'undefined') ? [containerLayer children] : [[doc currentPage] children],
		predicate = NSPredicate.predicateWithFormat("(className == %@)", "MSTextLayer"),
		layers = [scope filteredArrayUsingPredicate:predicate];

	// Deselect current selection
	[[doc currentPage] deselectAllLayers]

	// Loop through filtered layers and select them
	var loop = [layers objectEnumerator], layer;
  var misspellingcount = 0;
  var stopChecking = false;
  var madeAChange = false;
  while (layer = [loop nextObject]) {
    if(stopChecking){
      break; //If the user hits "Done", stop checking
    }

    //do spellcheck on each layer
    var aString = [layer stringValue]
    range = [[NSSpellChecker sharedSpellChecker] checkSpellingOfString:aString startingAt:0];
    while(range.length >0 ){
      var cursorLoc=range.location+range.length;

      //Select the layer
      [layer select:true byExpandingSelection:false]

      misspellingcount ++;

      var misSpelledWord = aString.substring(range.location, (range.location+range.length))
      var guesses = [[NSSpellChecker sharedSpellChecker] guessesForWordRange:range inString:aString language:language inSpellDocumentWithTag:0];

      //Build our alert
      var alert = NSAlert.alloc().init();

      alert.setMessageText('Spell Check Whole Page');
      alert.addButtonWithTitle('Skip'); //We must have a button here, so Skip makes the most sense.
      //alert.setIcon(NSImage.alloc().initWithContentsOfFile(
      //    context.plugin.urlForResourceNamed('DialogIcon512.png').path()));
      var nibui = new NibUI(context,
        'UIBundle', 'SpellCheckWholePage',
        ['textMisSpelling', 'replaceComboBox', 'btnReplace','btnIgnoreAll','btnAddDict','btnDone','textFullText']);

      alert.setAccessoryView(nibui.view);

      //Set up our text
      nibui.textMisSpelling.stringValue = "Mispelling: "+ misSpelledWord;
      nibui.textFullText.stringValue = aString;

      //Put guesses into the combobox
      nibui.replaceComboBox.removeAllItems();
      if ( guesses ){
        if (guesses.length >0){
          nibui.replaceComboBox.addItemsWithObjectValues( guesses );
          nibui.replaceComboBox.selectItemAtIndex( 0 );
        }
      }

      //Set up our button functions
      nibui.attachTargetAndAction(nibui.btnReplace, function() {
        madeAChange=true;
        //replace it in our string
        //var newWord = nibui.replaceComboBox.objectValueOfSelectedItem();
        var newWord = nibui.replaceComboBox.stringValue();
        aString = aString.replace( misSpelledWord, newWord);
        cursorLoc = range.location + newWord.length();
        app.stopModal();
      });

      nibui.attachTargetAndAction(nibui.btnDone, function() {
        // Stop!
        stopChecking = true;
        app.stopModal();
      });

      nibui.attachTargetAndAction(nibui.btnIgnoreAll, function(){

        //Ignore word for this document
        [[NSSpellChecker sharedSpellChecker] ignoreWord: misSpelledWord inSpellDocumentWithTag: 0]
        app.stopModal();
      });

      nibui.attachTargetAndAction(nibui.btnAddDict, function() {

        // Add the word to the Dictionary.
        [[NSSpellChecker sharedSpellChecker] learnWord: misSpelledWord]
        app.stopModal();
      });
      alert.runModal();

      nibui.destroy();
      if(stopChecking){
        break; //If the user hits "Done", stop checking
      }
      //Recheck the text for a misspelling (and loop again if there is one)
      range = [[NSSpellChecker sharedSpellChecker] checkSpellingOfString:aString startingAt:cursorLoc];

      if (range.location < cursorLoc ){
        //Break out of the loop if the search is resetting to the beginning
        break;
      }
    }
    //Do text replacement if we updated anything
    if (madeAChange){
      layer.setIsEditingText(true);
      layer.setStringValue(aString);
      layer.setIsEditingText(false);
    }
    //Reset
    madeAChange = false;

  }

  // MESSY! Simply duplicating the loop (need to make functions out of this)
  // Search symbols for misspellings too

  var allSymbols = context.document.documentData().allSymbols();
	for (var i = 0; i < allSymbols.count(); i++) {
    var symbol = allSymbols[i];
    var instances = symbol.allInstances()
    for (var j = 0; j < instances.count(); j++){
      var overrides = instances[j].overrides();
      if(overrides){
        var mutableOverrides = NSMutableDictionary.dictionaryWithDictionary(overrides);
        for( var k = 0; k < mutableOverrides.count(); k++){
          var thisOverride = NSMutableDictionary.dictionaryWithDictionary(mutableOverrides.objectForKey(k));
          for( var l = 0; l< thisOverride.allKeys().count(); l++){
            thisID = thisOverride.allKeys()[l];
            if ( thisOverride[thisID].className() == "__NSCFString"){
              //WHERE THE MAGIC HAPPENS! WE'VE FOUND A STRING!
            }
          }
        }
      }
    }
  }
    //We actually need to loop through the overrides themselves too. There's info here: http://sketchplugins.com/d/20-how-do-i-write-to-a-symbol-instance-override/6
    /* function executePopulateSymbol(instace, index) {

    var layerIDs = getLayerIDs(instance);
    var values = instance.overrides();

    if (!values){
        values = NSMutableDictionary.dictionary();
    }

    var existingOverrides = values;
    var mutableOverrides = NSMutableDictionary.dictionaryWithDictionary(existingOverrides)
    mutableOverrides.setObject_forKey(NSMutableDictionary.dictionaryWithDictionary(existingOverrides.objectForKey(0)),0)

    var imgURL = server + sectionDetailContent[index].thumb + "?" +token;
    var picture = NSImage.alloc().initWithData_( getImage(imgURL) );
    var imageData = MSImageData.alloc().initWithImage_convertColorSpace_(picture, nil);

    mutableOverrides.objectForKey(0).setObject_forKey(sectionDetailContent[index].title,layerIDs.title_ID)
    mutableOverrides.objectForKey(0).setObject_forKey(sectionDetailContent[index].year.toString(),layerIDs.year_ID)
    mutableOverrides.objectForKey(0).setObject_forKey(imageData,layerIDs.artwork_ID);

    instance.applyOverrides_allSymbols_(mutableOverrides,false);
}
*/

    if(stopChecking){
      break; //If the user hits "Done", stop checking
    }

    //do spellcheck on each layer
    var aString = [layer stringValue]
    range = [[NSSpellChecker sharedSpellChecker] checkSpellingOfString:aString startingAt:0];
    while(range.length >0 ){
      var cursorLoc=range.location+range.length;

      //Select the layer
      [layer select:true byExpandingSelection:false]

      misspellingcount ++;

      var misSpelledWord = aString.substring(range.location, (range.location+range.length))
      var guesses = [[NSSpellChecker sharedSpellChecker] guessesForWordRange:range inString:aString language:language inSpellDocumentWithTag:0];

      //Build our alert
      var alert = NSAlert.alloc().init();

      alert.setMessageText('Spell Check Whole Page');
      alert.addButtonWithTitle('Skip'); //We must have a button here, so Skip makes the most sense.
      //alert.setIcon(NSImage.alloc().initWithContentsOfFile(
      //    context.plugin.urlForResourceNamed('DialogIcon512.png').path()));
      var nibui = new NibUI(context,
        'UIBundle', 'SpellCheckWholePage',
        ['textMisSpelling', 'replaceComboBox', 'btnReplace','btnIgnoreAll','btnAddDict','btnDone','textFullText']);

      alert.setAccessoryView(nibui.view);

      //Set up our text
      nibui.textMisSpelling.stringValue = "Mispelling: "+ misSpelledWord;
      nibui.textFullText.stringValue = aString;

      //Put guesses into the combobox
      nibui.replaceComboBox.removeAllItems();
      if ( guesses ){
        if (guesses.length >0){
          nibui.replaceComboBox.addItemsWithObjectValues( guesses );
          nibui.replaceComboBox.selectItemAtIndex( 0 );
        }
      }

      //Set up our button functions
      nibui.attachTargetAndAction(nibui.btnReplace, function() {
        madeAChange=true;
        //replace it in our string
        //var newWord = nibui.replaceComboBox.objectValueOfSelectedItem();
        var newWord = nibui.replaceComboBox.stringValue();
        aString = aString.replace( misSpelledWord, newWord);
        cursorLoc = range.location + newWord.length();
        app.stopModal();
      });

      nibui.attachTargetAndAction(nibui.btnDone, function() {
        // Stop!
        stopChecking = true;
        app.stopModal();
      });

      nibui.attachTargetAndAction(nibui.btnIgnoreAll, function(){

        //Ignore word for this document
        [[NSSpellChecker sharedSpellChecker] ignoreWord: misSpelledWord inSpellDocumentWithTag: 0]
        app.stopModal();
      });

      nibui.attachTargetAndAction(nibui.btnAddDict, function() {

        // Add the word to the Dictionary.
        [[NSSpellChecker sharedSpellChecker] learnWord: misSpelledWord]
        app.stopModal();
      });
      alert.runModal();

      nibui.destroy();
      if(stopChecking){
        break; //If the user hits "Done", stop checking
      }
      //Recheck the text for a misspelling (and loop again if there is one)
      range = [[NSSpellChecker sharedSpellChecker] checkSpellingOfString:aString startingAt:cursorLoc];

      if (range.location < cursorLoc ){
        //Break out of the loop if the search is resetting to the beginning
        break;
      }
    }
    //Do text replacement if we updated anything
    if (madeAChange){
      layer.setIsEditingText(true);
      layer.setStringValue(aString);
      layer.setIsEditingText(false);
    }
    //Reset
    madeAChange = false;

  }


  if (misspellingcount == 0){
    doc.displayMessage("No Misspellings here!");
  } else if (misspellingcount == 1 ){
    doc.displayMessage(misspellingcount+ " misspelling found!");
  } else {
    doc.displayMessage(misspellingcount+ " misspellings found!");
  }

}
