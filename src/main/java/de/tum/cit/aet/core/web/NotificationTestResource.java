package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.notification.Email;
import de.tum.cit.aet.core.service.EmailService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationTestResource {

    private final EmailService emailService;

    @GetMapping
    public ResponseEntity<Void> getMessageBody() {
        //        Email email = Email.builder()
        //            .to("moritzschmidt1@gmail.com")
        //            .to("test@gmail.com")
        //            .cc("test1@gmail.com")
        //            .bcc("test2@gmail.com")
        //            .subject("Moritzschmidt1")
        //            .template("welcome")
        //            .content(new HashMap<>())
        //            .build();

        Email email = Email.builder()
            .to("moritzschmidt1@gmail.com")
            .to("test@gmail.com")
            .cc("test1@gmail.com")
            .bcc("test2@gmail.com")
            .subject("Moritzschmidt1")
            .htmlBody(
                "<p>Sehr geehrte*r Max Schulz,</p>\n" +
                "<br />\n" +
                "<p>\n" +
                "   ich freue mich, Ihnen mitteilen zu können, dass Sie für die Position <b>Researcher in Quantum Computing</b> in unserer Forschungsgruppe angenommen wurden. Ihr fachlicher Hintergrund, Ihre Motivation und Ihr Potenzial zur Mitgestaltung unserer akademischen und anwendungsorientierten Forschung haben uns überzeugt.\n" +
                "</p>\n" +
                "<br />\n" +
                "<p>\n" +
                "   In dieser Rolle übernehmen Sie die Verantwortung für Ihr Forschungsprojekt – einschließlich der inhaltlichen Ausrichtung, der Veröffentlichung Ihrer Ergebnisse und der aktiven Mitarbeit an laufenden Teamaktivitäten. Die Position erfordert ein hohes Maß an Engagement, Eigenständigkeit und Kommunikationsfähigkeit.\n" +
                "</p>\n" +
                "<br />\n" +
                "<p>\n" +
                "   Wir sind überzeugt von Ihrem Potenzial und freuen uns auf die Impulse, die Sie in unsere Gruppe und die wissenschaftliche Gemeinschaft einbringen werden.\n" +
                "</p>\n" +
                "<br />\n" +
                "<p>\n" +
                "   <b>\n" +
                "Bitte bestätigen Sie die Annahme dieses Angebots so bald wie möglich und kontaktieren Sie mich unter <a href=\"mailto:professor2@tum.de\">professor2@tum.de</a>, um die nächsten Schritte zu besprechen.\n" +
                "   </b>\n" +
                "</p>\n" +
                "<br />\n" +
                "<br />\n" +
                "<p>Mit freundlichen Grüßen,<br /><br />\n" +
                "   Professor2<br /><br />\n" +
                "   Professor2 TUM<br />\n" +
                "   Data Science Group<br />\n" +
                "   Technische Universität München<br />\n" +
                "   <a href=\"mailto:professor2@tum.de\">professor2@tum.de</a><br />\n" +
                "   <a href=\"https://ds.cit.tum.de\" target=\"_blank\">https://ds.cit.tum.de</a>\n" +
                "</p>\n" +
                "<br />\n"
            )
            .build();
        emailService.send(email);
        return ResponseEntity.ok().build();
    }
}
