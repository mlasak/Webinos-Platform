#include <gtk/gtk.h>
#include <gdk/gdkscreen.h>
#include <cairo.h>
#include <string.h>

static void screen_changed(GtkWidget *widget, GdkScreen *old_screen, gpointer user_data);
static gboolean expose(GtkWidget *widget, GdkEventExpose *event, gpointer user_data);
static void clicked(GtkWindow *win, GdkEventButton *event, gpointer user_data);
static void buttonclicked(GtkWindow *win, GdkEventButton *event, gpointer user_data);
static void dismissclicked(GtkWindow *win, GdkEventButton *event, gpointer user_data);


gboolean quit_requested = FALSE;
gint QuitProg(GtkWidget *widget, gpointer gdata){

if(!quit_requested){
gtk_main_quit();
}
return (FALSE);

}

int main(int argc, char **argv)
{
    gtk_init(&argc, &argv);

    GtkWidget *title;
    GtkWidget *body;

    GtkWidget *vbox;
    GtkWidget *hbox;
    GtkWidget *hbox2;


    GtkWidget *window = gtk_window_new(GTK_WINDOW_TOPLEVEL);

    gtk_window_set_position(GTK_WINDOW(window), GTK_WIN_POS_CENTER);
    gtk_window_set_default_size(GTK_WINDOW(window), 400, 120);
    gtk_window_set_modal(GTK_WINDOW (window),TRUE);
    //gtk_window_set_keep_above(GTK_WINDOW(window), TRUE);
    gtk_window_set_skip_taskbar_hint(GTK_WINDOW(window), TRUE);
    gtk_window_set_skip_pager_hint(GTK_WINDOW(window), TRUE);

    gtk_window_set_title(GTK_WINDOW(window), "Alert");
    g_signal_connect(G_OBJECT(window), "delete-event", GTK_SIGNAL_FUNC(QuitProg), NULL);
    

    gtk_widget_set_app_paintable(window, TRUE);

    g_signal_connect(G_OBJECT(window), "expose-event", G_CALLBACK(expose), NULL);
    g_signal_connect(G_OBJECT(window), "screen-changed", G_CALLBACK(screen_changed), NULL);
  

    gtk_window_set_decorated(GTK_WINDOW(window), FALSE);
    gtk_widget_add_events(window, GDK_BUTTON_PRESS_MASK);
    g_signal_connect(G_OBJECT(window), "button-press-event", G_CALLBACK(clicked), NULL);

    hbox = gtk_hbox_new(FALSE, 10);
    vbox = gtk_vbox_new(FALSE, 5);
    hbox2 = gtk_hbox_new(FALSE, 10);

    GtkWidget *halign = gtk_alignment_new(0.5, 0, 0, 0);
    gtk_container_add(GTK_CONTAINER(halign), hbox2);

        

    GtkWidget* button = gtk_button_new_with_label("Acknowledge");
    gtk_widget_set_size_request(button, 120, 30);
    g_signal_connect(G_OBJECT(button), "button-press-event", G_CALLBACK(buttonclicked), NULL);
    GtkWidget* dismiss = gtk_button_new_with_label("Dismiss");
    gtk_widget_set_size_request(dismiss, 120, 30);
    g_signal_connect(G_OBJECT(dismiss), "button-press-event", G_CALLBACK(dismissclicked), NULL);

    
    gtk_box_pack_start(GTK_BOX(vbox), gtk_label_new(" "), FALSE, FALSE, 0);
    title = gtk_label_new(NULL); 
	char finalTitle[100] ;
	sprintf(finalTitle, "<b>%s</b>", argv[1]);

    gtk_label_set_markup(GTK_LABEL(title), finalTitle); 

    gtk_box_pack_start(GTK_BOX(vbox), title, FALSE, FALSE, 0);
    body = gtk_label_new(argv[2]);

    gtk_box_pack_start(GTK_BOX(vbox), body, FALSE, FALSE, 0);
	//gtk_box_pack_start(GTK_BOX(vbox), gtk_label_new(" "), FALSE, FALSE, 0);

GdkColor color;
gdk_color_parse ("white", &color);
GdkColor color2;
gdk_color_parse ("gray", &color2);
gtk_widget_modify_fg ( GTK_WIDGET(title), GTK_STATE_NORMAL, &color);
gtk_widget_modify_fg ( GTK_WIDGET(body), GTK_STATE_NORMAL, &color2);



    gtk_box_pack_start(GTK_BOX(hbox2), button, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(hbox2), dismiss, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(vbox), halign, FALSE, FALSE, 10);

GtkWidget *image = gtk_image_new_from_file (argv[4]);

gtk_box_pack_start(GTK_BOX(hbox), image, FALSE, FALSE, 10);
    gtk_box_pack_start(GTK_BOX(hbox), vbox, FALSE, FALSE, 0);	

    gtk_container_add(GTK_CONTAINER(window), hbox);
    






	

    screen_changed(window, NULL, NULL);

    gtk_widget_show_all(window);
    gtk_main();

    return 0;
}


gboolean supports_alpha = FALSE;
static void screen_changed(GtkWidget *widget, GdkScreen *old_screen, gpointer userdata)
{
    /* To check if the display supports alpha channels, get the colormap */
    GdkScreen *screen = gtk_widget_get_screen(widget);
    GdkColormap *colormap = gdk_screen_get_rgba_colormap(screen);

    if (!colormap)
    {
       // printf("Your screen does not support alpha channels!\n");
        colormap = gdk_screen_get_rgb_colormap(screen);
        supports_alpha = FALSE;
    }
    else
    {
      //  printf("Your screen supports alpha channels!\n");
        supports_alpha = TRUE;
    }

    gtk_widget_set_colormap(widget, colormap);
}


static gboolean expose(GtkWidget *widget, GdkEventExpose *event, gpointer userdata)
{
   cairo_t *cr = gdk_cairo_create(widget->window);

    if (supports_alpha)
        cairo_set_source_rgba (cr, 0.3, 0.1, 0.1, 0.8); /* transparent */
    else
        cairo_set_source_rgb (cr, 0.3, 0.1, 0.1); /* opaque white */

    /* draw the background */
    cairo_set_operator (cr, CAIRO_OPERATOR_SOURCE);
    cairo_paint (cr);

    cairo_destroy(cr);

    return FALSE;
}

static void clicked(GtkWindow *win, GdkEventButton *event, gpointer user_data)
{
    /* toggle window manager frames */
    //gtk_window_set_decorated(win, !gtk_window_get_decorated(win));
	
}

static void buttonclicked(GtkWindow *win, GdkEventButton *event, gpointer user_data)
{
    printf("CLICKED\n");
    quit_requested=TRUE;
    gtk_main_quit();

    //gtk_window_set_decorated(win, !gtk_window_get_decorated(win));
	
}

static void dismissclicked(GtkWindow *win, GdkEventButton *event, gpointer user_data)
{
    printf("CLOSED\n");
    quit_requested=TRUE;
    gtk_main_quit();

    //gtk_window_set_decorated(win, !gtk_window_get_decorated(win));
	
}
