# 🚀 Building for Production

## Packaging as JAR

To build the final jar and optimize the TUMApply application for production, run:

```bash
./gradlew -Pprod clean bootJar
```

This will concatenate and minify the client CSS and JavaScript files. It will also modify `index.html` so it references
these new files.  
To ensure everything worked, run:

```bash
java -jar build/libs/*.jar
```

Then navigate to [http://localhost:8080](http://localhost:8080) in your browser.

---

## Packaging as WAR

To package your application as a WAR to deploy it to an application server, run:

```bash
./gradlew -Pprod -Pwar clean bootWar
```
