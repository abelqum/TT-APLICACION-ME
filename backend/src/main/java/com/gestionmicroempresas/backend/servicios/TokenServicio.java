
package com.gestionmicroempresas.backend.servicios;

import com.gestionmicroempresas.backend.entidades.Usuario;
import com.gestionmicroempresas.backend.seguridad.JwtConfiguracion;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class TokenServicio {

    public static final Duration DURACION =
            Duration.ofHours(2);

    public static final String NOMBRE_COOKIE =
            "SESION_TT";

    private final JwtEncoder codificadorJwt;

    public TokenServicio(JwtEncoder codificadorJwt) {
        this.codificadorJwt = codificadorJwt;
    }

    public String generarToken(Usuario usuario) {

        Instant ahora = Instant.now();

        JwtClaimsSet datos = JwtClaimsSet.builder()
                .issuer(JwtConfiguracion.EMISOR)
                .subject(usuario.getId().toString())
                .issuedAt(ahora)
                .expiresAt(ahora.plus(DURACION))
                .id(UUID.randomUUID().toString())

                .claim(
                        "empresaId",
                        usuario.getEmpresa().getId()
                )

                .claim(
                        "rol",
                        usuario.getRol().name()
                )

                .build();

        JwsHeader cabecera = JwsHeader
                .with(MacAlgorithm.HS256)
                .build();

        return codificadorJwt.encode(
                JwtEncoderParameters.from(
                        cabecera,
                        datos
                )
        ).getTokenValue();
    }
}
