import os
from aqt import mw, dialogs
from aqt.gui_hooks import (
    top_toolbar_did_init_links,
    main_window_did_init,
    dialog_manager_did_open_dialog,
)
from aqt.utils import askUser
from .flashcardmaker import FlashCardMakerWindow

"""
from aqt.gui_hooks import editor_did_init_buttons, overview_will_render_content, dialog_manager_did_open_dialog
def test(editor):
    showInfo('test')

def setupEditorButtonsFilter(buttons, editor):
    addon_path = os.path.dirname(__file__)
    b = editor.addButton(
        os.path.join(addon_path, "deutschland.svg"),
        "tablebutton",
        test,
        tip="insert",
        )
    buttons.append(b)
    return buttons

def overviewRenderContent(overview, content):
    content.table += "\n<div>my html</div>"

    return

# editor_did_init_buttons.append(setupEditorButtonsFilter)
# overview_will_render_content.append(overviewRenderContent)
"""


def setupModel(manager, name, instance):
    if not name == "flashcardmaker":
        return

    CARD_TYPE_NAME = "Deutschekarte"
    FLASHCARD_TEMPLATE_NAME = "Karteikarte"
    ret = mw.col.models.by_name(CARD_TYPE_NAME)
    if not ret:
        agree = askUser("Do you want to create the card type for German Flash Cards?")
        if not agree:
            return
        # create new card type
        model = mw.col.models.new(CARD_TYPE_NAME)

        # add fields
        mw.col.models.add_field(model, mw.col.models.new_field("Spelling"))
        mw.col.models.add_field(model, mw.col.models.new_field("Pronounciation"))
        mw.col.models.add_field(model, mw.col.models.new_field("Part"))
        mw.col.models.add_field(model, mw.col.models.new_field("Image"))
        mw.col.models.add_field(model, mw.col.models.new_field("Hint"))
        mw.col.models.add_field(model, mw.col.models.new_field("Type"))

        # add styling
        model["css"] = open(os.path.join("resources", "style.css")).read()

        # add templates
        template = mw.col.models.new_template(FLASHCARD_TEMPLATE_NAME)
        template["qfmt"] = open(os.path.join("resources", "front.html")).read()
        template["afmt"] = open(os.path.join("resources", "back.html")).read()
        mw.col.models.add_template(model, template)

        # add card type
        mw.col.models.add_dict(model)


def linkHandler():
    dialogs.open("flashcardmaker", mw)


def toolbarInit(links, toolbar):
    my_link = toolbar.create_link(
        cmd="gfcm",
        func=linkHandler,
        tip="open german flashcard maker",
        id="gfcm",
        label="GFCM",
    )
    links.append(my_link)


def mainWindowInit():
    dialogs.register_dialog(name="flashcardmaker", creator=FlashCardMakerWindow)


def setupAddon():
    mainWindowInit()


top_toolbar_did_init_links.append(toolbarInit)
main_window_did_init.append(setupAddon)
dialog_manager_did_open_dialog.append(setupModel)
