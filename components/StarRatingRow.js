function StarRatingRow({ value, onChange }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.starsRow}>
      {stars.map((s) => {
        const active = value >= s;
        return (
          <Pressable
            key={s}
            onPress={() => onChange(s)}
            style={styles.starBtn}
            hitSlop={8}
          >
            <Ionicons
              name={active ? 'star' : 'star-outline'}
              size={26}
              color={active ? '#F59E0B' : '#D1D5DB'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}