package com.relaywatch.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int COLOR_FONDO = Color.parseColor("#0f172a");

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configurarVentana();
        configurarInsets();
    }

    private void configurarVentana() {
        Window window = getWindow();

        // Fondo de la ventana
        window.getDecorView().setBackgroundColor(COLOR_FONDO);

        // Colores de las barras del sistema
        window.setStatusBarColor(COLOR_FONDO);
        window.setNavigationBarColor(COLOR_FONDO);

        // Iconos claros sobre fondo oscuro
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(false);
            insetsController.setAppearanceLightNavigationBars(false);
        }
    }

    private void configurarInsets() {
        // Obtener el contenedor principal (android.R.id.content)
        View contentView = findViewById(android.R.id.content);
        if (contentView == null) return;

        // Aplicar padding basado en los insets del sistema
        // Esto hace que la app "viva" entre la status bar y la navigation bar
        ViewCompat.setOnApplyWindowInsetsListener(contentView, (view, windowInsets) -> {
            Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            // Aplicar padding para que el contenido no quede debajo de las barras
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
