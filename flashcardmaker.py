import re
import os
import hashlib
import base64
import aqt
from aqt import QDialog
from aqt.qt import Qt
from typing import Callable
from aqt.utils import showInfo

from .forms.flashcardmaker import Ui_MeinWindow

pos2pageindex = {
    "Nomen": 0,
    "Verben": 1,
    "Adjektiv": 2,
}

part2abbr = {
    "Nomen": "n",
    "Verben": "v",
    "Adjektiv": "adj",
    "Artikel": "art",
    "Pronomen": "pron",
    "Adverbien": "adv",
    "Kunjunktionen": "conj",
    "Wechselpräpositionen": "prep",
    "Einwürfe": "num",
}

DECK_NAME = 'Test'
CARD_TYPE_NAME = 'Deutschekarte'

class FlashCardMakerWindow(QDialog):
    def __init__(self, mw: aqt.AnkiQt) -> None:
        QDialog.__init__(self, mw, Qt.WindowType.Window)
        self.mw = mw
        self.name = "flashcardmaker"
        self.period = 0
        self.form = Ui_MeinWindow()
        self.oldPos = None
        self.wholeCollection = False
        self.setMinimumWidth(700)
        f = self.form
        f.setupUi(self)
        self.setupPager()
        self.setupButtons()
        self.setupImageTextEdit()
        self.show()

    def onPosDropdown(self, index):
        t = self.form.pos_dropdown.itemText(index)
        ind = pos2pageindex[t] if t in pos2pageindex else len(pos2pageindex)
        self.form.pager.setCurrentIndex(ind)

    def setupPager(self):
        self.form.pager.setCurrentIndex(0)
        self.form.pos_dropdown.currentIndexChanged.connect(self.onPosDropdown)

    def getSpelling(self):
        t = self.form.pos_dropdown.currentText()
        if t == "Nomen":
            return "{article} {stem}, -{genitive}, -{plural}".format(
                article=self.form.gender_dropdown.currentText(),
                stem=self.form.stem_text.text(),
                genitive=self.form.genitive_text.text(),
                plural=self.form.plural_text.text(),
            )
        elif t == "Verben":
            return
        elif t == "Adjektiv":
            return
        else:
            return

    def addNote(self):
        spelling = self.getSpelling()
        pronounciation = self.form.pronounciation_text.text()
        part = part2abbr[self.form.pos_dropdown.currentText()]

        # save image
        image = self.getImage()
        if not image:
            return
        file_name = image['name'] + '.' + image['format']
        media_dir = self.mw.col.media.dir()
        file_path = os.path.join(media_dir, file_name)
        if not os.path.exists(file_path):
            with open(file_path, 'wb') as f:
                f.write(image['data'])

        hint = self.form.hint_text.text()
        type = self.form.irregular_checkbox.isChecked()

        deck = self.mw.col.decks.id_for_name(DECK_NAME)
        model = self.mw.col.models.by_name(CARD_TYPE_NAME)
        note = self.mw.col.new_note(model)
        note.fields = [
            spelling,
            pronounciation,
            part,
            file_name,
            hint,
            'irregular' if type else '',
        ]

        found = self.mw.col.find_notes('spelling:"%s"' % (spelling))
        if found:
            showInfo('Card already exists.')
            return
        self.mw.col.add_note(note, deck)
        showInfo('Added successfully!')

    def onAddButtonClick(self):
        self.addNote()

    def setupButtons(self):
        self.form.add_button.clicked.connect(self.addNote)

    def getImage(self):
        image = self.form.image_text.toHtml()
        image = re.findall('<img src="(.*)" ', image)
        if not image:
            return
        image = image[0]
        if not image.startswith('data:image'):
            return
        image_format, image_data = image.split(',')
        image_format = image_format.split('/')[1].split(';')[0]
        image_data = base64.b64decode(image_data)
        image_name = hashlib.sha256(image_data).hexdigest()
        return {'name': image_name, 'format': image_format, 'data': image_data}
    
    def onImageTextEditChange(self):
        image = self.getImage()
        if not image:
            return
        self.form.paste_image_hint.setText(image['name'] + '.' + image['format'])

    def setupImageTextEdit(self):
        self.form.image_text.textChanged.connect(self.onImageTextEditChange)
        return

    def closeWithCallback(self, callback: Callable[[], None]) -> None:
        self.reject()
        callback()

    def reject(self) -> None:
        aqt.dialogs.markClosed("flashcardmaker")
        QDialog.reject(self)
