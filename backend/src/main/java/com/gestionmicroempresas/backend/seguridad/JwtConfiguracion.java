
package com.gestionmicroempresas.backend.seguridad;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import java.util.Base64;

@Configuration
public class JwtConfiguracion {

    public static final String EMISOR =
            "gestion-microempresas";

    @Bean
    public SecretKey claveJwt(
            @Value("${app.jwt.secreto}") String secreto
    ) {

        byte[] bytes;

        try {
            bytes = Base64.getDecoder().decode(secreto);
        } catch (IllegalArgumentException excepcion) {
            throw new IllegalStateException(
                    "JWT_SECRETO debe contener una clave Base64 válida.",
                    excepcion
            );
        }

        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRETO debe contener al menos 32 bytes."
            );
        }

        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    public JwtEncoder codificadorJwt(SecretKey claveJwt) {

        return NimbusJwtEncoder
                .withSecretKey(claveJwt)
                .algorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    public JwtDecoder decodificadorJwt(SecretKey claveJwt) {

        NimbusJwtDecoder decodificador =
                NimbusJwtDecoder
                        .withSecretKey(claveJwt)
                        .macAlgorithm(MacAlgorithm.HS256)
                        .build();

        decodificador.setJwtValidator(
                JwtValidators.createDefaultWithIssuer(EMISOR)
        );

        return decodificador;
    }
}
