import re
from re import Match
import os
import html
import bs4
from bs4 import BeautifulSoup
import requests
import warnings
import urllib
import tempfile
import shutil
from hashlib import sha1
from typing import Callable
import base64

import aqt
from aqt import QDialog, QClipboard, QMimeData, QImage, QBuffer
from aqt.qt import Qt
from aqt.utils import showInfo, showWarning, tr
from anki.httpclient import HttpClient
from anki.collection import Config
from PyQt6 import QtCore, QtGui

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

pics = ("jpg", "jpeg", "png", "tif", "tiff", "gif", "svg", "webp", "ico", "avif")
audio = (
    "3gp",
    "aac",
    "avi",
    "flac",
    "flv",
    "m4a",
    "mkv",
    "mov",
    "mp3",
    "mp4",
    "mpeg",
    "mpg",
    "oga",
    "ogg",
    "ogv",
    "ogx",
    "opus",
    "spx",
    "swf",
    "wav",
    "webm",
)

DECK_NAME = "Test"
CARD_TYPE_NAME = "Deutschekarte"


def checksum(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return sha1(data).hexdigest()


_tmpdir: str | None
_tmpdir = None


def tmpdir() -> str:
    "A reusable temp folder which we clean out on each program invocation."
    global _tmpdir  # pylint: disable=invalid-name
    if not _tmpdir:

        def cleanup() -> None:
            if os.path.exists(_tmpdir):
                shutil.rmtree(_tmpdir)

        import atexit

        atexit.register(cleanup)
        _tmpdir = os.path.join(tempfile.gettempdir(), "anki_temp")
    try:
        os.mkdir(_tmpdir)
    except FileExistsError:
        pass
    return _tmpdir


def namedtmp(name: str, remove: bool = True) -> str:
    "Return tmpdir+name. Deletes any existing file."
    path = os.path.join(tmpdir(), name)
    if remove:
        try:
            os.unlink(path)
        except OSError:
            pass
    return path


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
        # word
        self.setupPager()
        self.setupButtons()
        self.setupImageTextEdit()
        # sentence
        self.setupTable()
        self.show()

    # pager
    def onPosDropdown(self, index):
        t = self.form.pos_dropdown.itemText(index)
        ind = pos2pageindex[t] if t in pos2pageindex else len(pos2pageindex)
        self.form.pager.setCurrentIndex(ind)

    def setupPager(self):
        self.form.pager.setCurrentIndex(0)
        self.form.pos_dropdown.currentIndexChanged.connect(self.onPosDropdown)

    # add note
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
            return "{inf}, {pr3}, {past}, {pp}".format(
                inf=self.form.inf_text.text(),
                pr3=self.form.pr3_text.text(),
                past=self.form.past_text.text(),
                pp=self.form.pp_text.text(),
            )
        elif t == "Adjektiv":
            return "{positiv}, {komparativ}, {superlativ}".format(
                positiv=self.form.positiv_text.text(),
                komparativ=self.form.komparativ_text.text(),
                superlativ=self.form.superlativ_text.text(),
            )
        else:
            return self.form.spelling_text.text()

    def addNote(self):
        spelling = self.getSpelling()
        if not spelling:
            return
        pronounciation = self.form.pronounciation_text.text()
        part = part2abbr[self.form.pos_dropdown.currentText()]

        # save image
        doc = BeautifulSoup(self.form.image_text.toHtml(), "html.parser")
        file_name = doc("img")[0]["src"]

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
            "irregular" if type else "",
        ]

        found = self.mw.col.find_notes('spelling:"%s"' % (spelling))
        if found:
            showInfo("Card already exists.")
            return
        self.mw.col.add_note(note, deck)
        showInfo("Added successfully!")

    def onAddButtonClick(self):
        self.addNote()

    def setupButtons(self):
        self.form.add_button.clicked.connect(self.addNote)

    # ImageTextEdit
    def urlToLink(self, url: str) -> str | None:
        fname = self.urlToFile(url)
        if not fname:
            return '<a href="{}">{}</a>'.format(
                url, html.escape(urllib.parse.unquote(url))
            )
        return self.fnameToLink(fname)

    def fnameToLink(self, fname: str) -> str:
        ext = fname.split(".")[-1].lower()
        if ext in pics:
            name = urllib.parse.quote(fname.encode("utf8"))
            return f'<img src="{name}">'

    def urlToFile(self, url: str) -> str | None:
        l = url.lower()
        for suffix in pics + audio:
            if l.endswith(f".{suffix}"):
                return self._retrieveURL(url)
        # not a supported type
        return None

    def isURL(self, s: str) -> bool:
        s = s.lower()
        return (
            s.startswith("http://")
            or s.startswith("https://")
            or s.startswith("ftp://")
            or s.startswith("file://")
        )

    def inlinedImageToFilename(self, txt: str) -> str:
        prefix = "data:image/"
        suffix = ";base64,"
        for ext in ("jpg", "jpeg", "png", "gif"):
            fullPrefix = prefix + ext + suffix
            if txt.startswith(fullPrefix):
                b64data = txt[len(fullPrefix) :].strip()
                data = base64.b64decode(b64data, validate=True)
                if ext == "jpeg":
                    ext = "jpg"
                return self._addPastedImage(data, ext)

        return ""

    def inlinedImageToLink(self, src: str) -> str:
        fname = self.inlinedImageToFilename(src)
        if fname:
            return self.fnameToLink(fname)

        return ""

    def _pasted_image_filename(self, data: bytes, ext: str) -> str:
        csum = checksum(data)
        return f"paste-{csum}.{ext}"

    def _read_pasted_image(self, mime: QMimeData) -> str:
        image = QImage(mime.imageData())
        buffer = QBuffer()
        buffer.open(QBuffer.OpenModeFlag.ReadWrite)
        if self.mw.col.get_config_bool(Config.Bool.PASTE_IMAGES_AS_PNG):
            ext = "png"
            quality = 50
        else:
            ext = "jpg"
            quality = 80
        image.save(buffer, ext, quality)
        buffer.reset()
        data = bytes(buffer.readAll())  # type: ignore
        fname = self._pasted_image_filename(data, ext)
        path = namedtmp(fname)
        with open(path, "wb") as file:
            file.write(data)

        return path

    def _addPastedImage(self, data: bytes, ext: str) -> str:
        # hash and write
        fname = self._pasted_image_filename(data, ext)
        return self._addMediaFromData(fname, data)

    def _retrieveURL(self, url: str) -> str | None:
        "Download file into media folder and return local filename or None."
        local = url.lower().startswith("file://")
        # fetch it into a temporary folder
        self.mw.progress.start(immediate=not local)
        content_type = None
        error_msg: str | None = None
        try:
            if local:
                # urllib doesn't understand percent-escaped utf8, but requires things like
                # '#' to be escaped.
                url = urllib.parse.unquote(url)
                url = url.replace("%", "%25")
                url = url.replace("#", "%23")
                req = urllib.request.Request(
                    url, None, {"User-Agent": "Mozilla/5.0 (compatible; Anki)"}
                )
                with urllib.request.urlopen(req) as response:
                    filecontents = response.read()
            else:
                with HttpClient() as client:
                    client.timeout = 30
                    with client.get(url) as response:
                        if response.status_code != 200:
                            error_msg = tr.qt_misc_unexpected_response_code(
                                val=response.status_code,
                            )
                            return None
                        filecontents = response.content
                        content_type = response.headers.get("content-type")
        except (urllib.error.URLError, requests.exceptions.RequestException) as e:
            error_msg = tr.editing_an_error_occurred_while_opening(val=str(e))
            return None
        finally:
            self.mw.progress.finish()
            if error_msg:
                showWarning(error_msg)
        # strip off any query string
        url = re.sub(r"\?.*?$", "", url)
        fname = os.path.basename(urllib.parse.unquote(url))
        if not fname.strip():
            fname = "paste"
        if content_type:
            fname = self.mw.col.media.add_extension_based_on_mime(fname, content_type)

        return self.mw.col.media.write_data(fname, filecontents)

    removeTags = ["script", "iframe", "object", "style"]

    def _pastePreFilter(self, html: str) -> str:
        # https://anki.tenderapp.com/discussions/ankidesktop/39543-anki-is-replacing-the-character-by-when-i-exit-the-html-edit-mode-ctrlshiftx
        if html.find(">") < 0:
            return html

        with warnings.catch_warnings() as w:
            warnings.simplefilter("ignore", UserWarning)
            doc = BeautifulSoup(html, "html.parser")

        tag: bs4.element.Tag
        for tag in self.removeTags:
            for node in doc(tag):
                node.decompose()

        # convert p tags to divs
        for node in doc("p"):
            node.name = "div"

        for tag in doc("img"):
            try:
                src = tag["src"]
            except KeyError:
                # for some bizarre reason, mnemosyne removes src elements
                # from missing media
                continue

            # in external pastes, download remote media
            if self.isURL(src):
                fname = self._retrieveURL(src)
                if fname:
                    tag["src"] = fname
            elif src.startswith("data:image/"):
                # and convert inlined data
                tag["src"] = self.inlinedImageToFilename(src)

        html = str(doc)
        return html

    def _onPaste(self, mode: QClipboard.Mode) -> None:
        mime = self.mw.app.clipboard().mimeData(mode=mode)
        html = self._processMime(mime)
        html = self._pastePreFilter(html)
        self.form.image_text.setText(html)

    def _processMime(self, mime: QMimeData, drop_event: bool = False) -> str:
        # favour url if it's a local link
        if (
            mime.hasUrls()
            and (urls := mime.urls())
            and urls[0].toString().startswith("file://")
        ):
            types = (self._processUrls, self._processImage, self._processText)
        else:
            types = (self._processImage, self._processUrls, self._processText)

        for fn in types:
            html = fn(mime)
            if html:
                return html
        return ""

    def _processUrls(self, mime: QMimeData) -> str | None:
        if not mime.hasUrls():
            return None

        buf = ""
        for qurl in mime.urls():
            url = qurl.toString()
            # chrome likes to give us the URL twice with a \n
            if lines := url.splitlines():
                url = lines[0]
                buf += self.urlToLink(url)

        return buf

    def _processText(self, mime: QMimeData) -> str | None:
        if not mime.hasText():
            return None

        txt = mime.text()
        processed = []
        lines = txt.split("\n")

        for line in lines:
            for token in re.split(r"(\S+)", line):
                # inlined data in base64?
                if token.startswith("data:image/"):
                    processed.append(self.inlinedImageToLink(token))
                elif self.isURL(token):
                    # if the user is pasting an image or sound link, convert it to local, otherwise paste as a hyperlink
                    link = self.urlToLink(token)
                    processed.append(link)
                else:
                    token = html.escape(token).replace("\t", " " * 4)

                    # if there's more than one consecutive space,
                    # use non-breaking spaces for the second one on
                    def repl(match: Match) -> str:
                        return f"{match.group(1).replace(' ', '&nbsp;')} "

                    token = re.sub(" ( +)", repl, token)
                    processed.append(token)

            processed.append("<br>")
        # remove last <br>
        processed.pop()
        return "".join(processed)

    def _addMedia(self, path: str, canDelete: bool = False) -> str:
        """Add to media folder and return local img or sound tag."""
        # copy to media folder
        fname = self.mw.col.media.add_file(path)
        # return a local html link
        return self.fnameToLink(fname)

    def _processImage(self, mime: QMimeData) -> str | None:
        if not mime.hasImage():
            return None
        path = self._read_pasted_image(mime)
        fname = self._addMedia(path)

        return fname

    def onImagePaste(self):
        self._onPaste(QClipboard.Mode.Clipboard)

    def setupImageTextEdit(self):
        media_dir = self.mw.col.media.dir()
        self.form.image_text.document().setMetaInformation(
            QtGui.QTextDocument.MetaInformation.DocumentUrl,
            QtCore.QUrl.fromLocalFile(media_dir).toString() + "/",
        )
        self.form.image_button.clicked.connect(self.onImagePaste)

    # group table
    def setupTable(self):
        t = self.form.group_table
        t.setColumnCount(3)
        t.setHorizontalHeaderLabels(["", "Spelling", "Meaning"])

    # clean up
    def closeWithCallback(self, callback: Callable[[], None]) -> None:
        self.reject()
        callback()

    def reject(self) -> None:
        aqt.dialogs.markClosed("flashcardmaker")
        QDialog.reject(self)
